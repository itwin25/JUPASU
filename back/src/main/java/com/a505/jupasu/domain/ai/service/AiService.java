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
     * [채팅] 실시간 소믈리에 대화 (멀티턴 지원 및 스트리밍 보장)
     */
    public Flux<String> chat(ChatRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = "session-" + user.getId(); // 기본 세션 ID 생성
        }

        // 1. 현재 사용자 메시지를 먼저 DB에 저장 (맥락에 포함시키기 위함)
        if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            chatMessageRepository.save(new ChatMessage(sessionId, user, "user", request.getMessage()));
        }

        // 2. 현재 메시지를 포함하여 DB에서 최근 대화 내역 조회
        List<ChatMessage> historyEntities = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        
        // 3. AI 서버 규격에 맞게 히스토리 변환
        List<Map<String, String>> history = historyEntities.stream()
                .map(msg -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("role", msg.getRole());
                    map.put("content", msg.getContent());
                    return map;
                })
                .collect(Collectors.toList());

        // 4. AI 서버 호출 페이로드 구성
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("history", history); // 이제 현재 메시지가 포함된 이력이 전달됨
        payload.put("session_id", sessionId); // 세션 ID 추가
        payload.put("selected_wine", request.getSelectedWine() != null ? request.getSelectedWine() : null);
        payload.put("selected_menu", request.getSelectedMenu() != null ? request.getSelectedMenu() : null);
        payload.put("user_id", user.getId());
        payload.put("stream", true);
        payload.put("mentioned_friends", List.of());

        StringBuilder fullTextForStorage = new StringBuilder();
        final String finalSessionId = sessionId; // 람다용 상수

        return webClient.post()
                .uri("/v1/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(payload)
                .retrieve()
                .bodyToFlux(String.class)
                .flatMap(rawChunk -> {
                    if (rawChunk == null || rawChunk.trim().isEmpty() || rawChunk.contains("[DONE]")) {
                        return Flux.empty();
                    }
                    
                    try {
                        return Flux.fromArray(rawChunk.split("\n"))
                                .map(String::trim)
                                .filter(line -> !line.isEmpty() && !line.startsWith("event:"))
                                .map(line -> {
                                    try {
                                        String jsonData = line;
                                        if (line.startsWith("data:")) {
                                            jsonData = line.substring(5).trim();
                                        }
                                        
                                        if (jsonData.equals("[DONE]")) return line;

                                        JsonNode root = objectMapper.readTree(jsonData);
                                        String content = root.path("content").asText("");
                                        if (!content.isEmpty()) {
                                            fullTextForStorage.append(content);
                                        }
                                    } catch (Exception e) {
                                        log.warn("📦 [Parsing Error] Line: {}, Error: {}", line, e.getMessage());
                                    }
                                    return line;
                                });
                    } catch (Exception e) {
                        return Flux.empty();
                    }
                })
                .doOnComplete(() -> {
                    if (fullTextForStorage.length() > 0) {
                        // 5. AI 응답 저장 시 sessionId 포함
                        chatMessageRepository.save(new ChatMessage(finalSessionId, user, "assistant", fullTextForStorage.toString()));
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
