package com.a505.jupasu.domain.ai.service;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.request.RefineRequest;
import com.a505.jupasu.domain.ai.dto.response.ChatResponse;
import com.a505.jupasu.domain.ai.dto.response.RefineResponse;
import com.a505.jupasu.domain.ai.entity.ChatMessage;
import com.a505.jupasu.domain.ai.repository.ChatMessageRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AiService {

    private final WebClient webClient;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * [채팅] 실시간 소믈리에 대화 (완전한 실시간 스트리밍 보장)
     */
    public Flux<String> chat(ChatRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            chatMessageRepository.save(new ChatMessage(user, "user", request.getMessage()));
        }
        // AI 서버 규격에 맞게 페이로드 구성
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("selected_wine", request.getSelectedWine() != null ? request.getSelectedWine() : null);
        payload.put("selected_menu", request.getSelectedMenu() != null ? request.getSelectedMenu() : null);
        payload.put("user_id", user.getId()); // getId()로 수정
        payload.put("stream", true);
        payload.put("mentioned_friends", List.of());


        StringBuilder fullTextForStorage = new StringBuilder();

        return webClient.post()
                .uri("/v1/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(payload)
                .retrieve()
                .bodyToFlux(String.class)
                .flatMap(rawChunk -> {
                    log.info("📡 [AI Raw Chunk]: {}", rawChunk);
                    // [DONE] 신호나 빈 값 처리
                    if (rawChunk == null || rawChunk.trim().isEmpty() || rawChunk.contains("[DONE]")) {
                        return Flux.empty();
                    }
                    
                    try {
                        // AI 서버가 가끔 여러 줄을 한 번에 보낼 수 있으므로 줄바꿈 처리
                        return Flux.fromArray(rawChunk.split("\n"))
                                .filter(line -> !line.trim().isEmpty())
                                .map(line -> {
                                    log.info("🔍 [Processing Line]: {}", line);
                                    try {
                                        JsonNode root = objectMapper.readTree(line);
                                        String content = root.path("content").asText("");
                                        fullTextForStorage.append(content);
                                    } catch (Exception e) {
                                        log.warn("📦 [Parsing Error]: {}", e.getMessage());
                                    }
                                    return line; // 원본 JSON(또는 라인)을 컨트롤러로 전달
                                });
                    } catch (Exception e) {
                        return Flux.empty();
                    }
                })
                .doOnComplete(() -> {
                    if (fullTextForStorage.length() > 0) {
                        chatMessageRepository.save(new ChatMessage(user, "assistant", fullTextForStorage.toString()));
                    }
                });
    }

    /**
     * [정제] OCR 텍스트 정제 통합
     */
    public RefineResponse refine(RefineRequest request, String email) {
        if (request.getTextContent() == null || request.getTextContent().trim().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("task", request.getTask());
        payload.put("text_content", request.getTextContent());
        payload.put("user_id", email);

        RefineResponse response = webClient.post()
                .uri("/v1/refine")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(RefineResponse.class)
                .block();

        log.info("🤖 [AI Server Response] Status: {}, Data: {}", 
                response != null ? response.getStatus() : "null",
                response != null ? response.getData() : "null");

        return response;
    }

    /**
     * 채팅 내역 조회
     */
    @Transactional(readOnly = true)
    public List<ChatResponse> getChatHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return chatMessageRepository.findByUserOrderByCreatedAtAsc(user)
                .stream()
                .map(ChatResponse::from)
                .collect(Collectors.toList());
    }
}
