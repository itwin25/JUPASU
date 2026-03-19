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
@Transactional
public class AiService {

    private final WebClient webClient;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final RedisService redisService;
    private final ObjectMapper objectMapper = new ObjectMapper(); // 직접 생성하여 의존성 문제 해결

    public AiService(WebClient webClient, ChatMessageRepository chatMessageRepository, 
                     UserRepository userRepository, RedisService redisService) {
        this.webClient = webClient;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.redisService = redisService;
    } // JSON 파싱을 위한 도구 추가

    private static final String CHAT_CACHE_PREFIX = "chat:cache:";
    private static final int MAX_CHAT_CACHE_SIZE = 10;

    /**
     * [고도화] 통합 소믈리에 프로세스 (OCR + LLM)
     * stream 여부에 따라 Flux(스트림) 또는 Mono(단일응답)를 반환할 수 있도록 유연하게 구성합니다.
     */
    private MultipartBodyBuilder createMultipartBuilder(String taskType, String textContent, MultipartFile file, String email, boolean stream) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("task", taskType);
        builder.part("user_id", email);
        builder.part("stream", String.valueOf(stream));
        if (textContent != null) builder.part("text_content", textContent);
        if (file != null && !file.isEmpty()) builder.part("file", file.getResource());
        return builder;
    }

    /**
     * 스트리밍 방식 호출 (CHAT용)
     */
    public Flux<String> processSommelierStream(String taskType, String textContent, MultipartFile file, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MultipartBodyBuilder builder = createMultipartBuilder(taskType, textContent, file, email, true);
        StringBuilder fullTextForStorage = new StringBuilder();
        String redisKey = CHAT_CACHE_PREFIX + email;

        return webClient.post()
                .uri("/v1/sommelier/process")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToFlux(String.class)
                .doOnNext(chunk -> {
                    try {
                        if (chunk.startsWith("data: ")) {
                            String jsonData = chunk.substring(6).trim();
                            if (!jsonData.equals("[DONE]")) {
                                JsonNode root = objectMapper.readTree(jsonData);
                                fullTextForStorage.append(root.path("content").asText(""));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("파싱 오류: {}", e.getMessage());
                    }
                })
                .doOnComplete(() -> {
                    if (!fullTextForStorage.isEmpty()) {
                        String finalAiContent = fullTextForStorage.toString();
                        chatMessageRepository.save(ChatMessage.builder().user(user).role("assistant").content(finalAiContent).build());
                        redisService.pushToList(redisKey, "AI: " + finalAiContent);
                    }
                });
    }

    /**
     * 단일 응답 방식 호출 (SCAN용)
     */
    public Map<String, Object> processSommelierSync(String taskType, String textContent, MultipartFile file, String email) {
        MultipartBodyBuilder builder = createMultipartBuilder(taskType, textContent, file, email, false);

        return webClient.post()
                .uri("/v1/sommelier/process")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block(); // 분석 결과는 동기적으로 기다려서 받음
    }

    /**
     * 와인 라벨 분석 (독립 실행 - 이미지 또는 텍스트 지원)
     */
    public Map<String, Object> scanLabel(String textContent, MultipartFile file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (textContent != null) builder.part("text_content", textContent);
        if (file != null && !file.isEmpty()) builder.part("file", file.getResource());

        return webClient.post()
                .uri("/v1/vision/ocr/label")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }

    /**
     * 메뉴판 분석 (독립 실행 - 이미지 또는 텍스트 지원)
     */
    public Map<String, Object> scanMenu(String textContent, MultipartFile file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        if (textContent != null) builder.part("text_content", textContent);
        if (file != null && !file.isEmpty()) builder.part("file", file.getResource());

        return webClient.post()
                .uri("/v1/vision/ocr/menu")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
    }
}
