package com.a505.jupasu.domain.ai.service;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.response.OcrResponse;
import com.a505.jupasu.domain.ai.entity.ChatMessage;
import com.a505.jupasu.domain.ai.repository.ChatMessageRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.redis.RedisService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * [Spring 초보자 가이드]
 * OpenAI 표준 규격의 스트리밍 데이터를 처리하고 중계하는 서비스입니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AiService {

    private final WebClient webClient;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper; // JSON 파싱을 위한 도구 추가

    private static final String CHAT_CACHE_PREFIX = "chat:cache:";
    private static final int MAX_CHAT_CACHE_SIZE = 10;

    /**
     * OpenAI 표준 규격 스트리밍 처리
     */
    public Flux<String> streamChat(ChatRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String redisKey = CHAT_CACHE_PREFIX + email;

        // [사용자 질문 저장]
        chatMessageRepository.save(ChatMessage.builder().user(user).role("user").content(request.getMessage()).build());
        redisService.pushToList(redisKey, "User: " + request.getMessage());
        redisService.trimList(redisKey, MAX_CHAT_CACHE_SIZE);

        Map<String, Object> body = Map.of(
                "messages", new Object[]{Map.of("role", "user", "content", request.getMessage())},
                "stream", true
        );

        StringBuilder fullTextForStorage = new StringBuilder();

        return webClient.post()
                .uri("/v1/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("AI 서버 에러: {}", errorBody);
                                    return Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR));
                                }))
                .bodyToFlux(String.class)
                .doOnNext(chunk -> {
                    // [핵심: 데이터 가공 로직]
                    // OpenAI 규격(data: { ... })에서 실제 텍스트만 뽑아내어 저장용으로 합칩니다.
                    try {
                        if (chunk.startsWith("data: ")) {
                            String jsonData = chunk.substring(6).trim();
                            if (!jsonData.equals("[DONE]")) {
                                JsonNode root = objectMapper.readTree(jsonData);
                                String content = root.path("choices").get(0).path("delta").path("content").asText("");
                                fullTextForStorage.append(content);
                            }
                        }
                    } catch (Exception e) {
                        log.warn("데이터 조각 파싱 중 오류 발생 (무시하고 계속 진행): {}", e.getMessage());
                    }
                })
                .doOnComplete(() -> {
                    // [스트림 완료 시 DB/Redis 최종 저장]
                    if (!fullTextForStorage.isEmpty()) {
                        String finalAiContent = fullTextForStorage.toString();
                        chatMessageRepository.save(ChatMessage.builder().user(user).role("assistant").content(finalAiContent).build());
                        redisService.pushToList(redisKey, "AI: " + finalAiContent);
                        redisService.trimList(redisKey, MAX_CHAT_CACHE_SIZE);
                        redisService.expire(redisKey, 86400);
                        log.info("AI 표준 답변 저장 완료");
                    }
                })
                .onErrorMap(e -> {
                    if (e instanceof WebClientRequestException) return new CustomException(ErrorCode.AI_SERVER_UNAVAILABLE);
                    if (e instanceof java.util.concurrent.TimeoutException || e.getCause() instanceof io.netty.handler.timeout.ReadTimeoutException) return new CustomException(ErrorCode.AI_PROCESSING_TIMEOUT);
                    return e instanceof CustomException ? e : new CustomException(ErrorCode.AI_SERVER_ERROR);
                });
    }

    /**
     * OCR 분석 결과를 가져옵니다.
     */
    public OcrResponse ocr(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new CustomException(ErrorCode.INVALID_REQUEST, "파일이 존재하지 않습니다.");

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());

        return webClient.post()
                .uri("/v1/vision/ocr")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(),
                        clientResponse -> clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> Mono.error(new CustomException(ErrorCode.AI_SERVER_ERROR))))
                .bodyToMono(OcrResponse.class)
                .onErrorMap(e -> {
                    if (e instanceof WebClientRequestException) return new CustomException(ErrorCode.AI_SERVER_UNAVAILABLE);
                    if (e instanceof java.util.concurrent.TimeoutException || e.getCause() instanceof io.netty.handler.timeout.ReadTimeoutException) return new CustomException(ErrorCode.AI_PROCESSING_TIMEOUT);
                    return e instanceof CustomException ? e : new CustomException(ErrorCode.AI_SERVER_ERROR);
                })
                .block();
    }
}
