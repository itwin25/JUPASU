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
import org.springframework.http.MediaType;
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

    public Flux<String> chat(ChatRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = "session-" + user.getId();
        }

        if (request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            chatMessageRepository.save(new ChatMessage(sessionId, user, "user", request.getMessage()));
        }

        List<ChatMessage> historyEntities = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<Map<String, String>> history = historyEntities.stream()
                .map(msg -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("role", msg.getRole());
                    map.put("content", msg.getContent());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("history", history);
        payload.put("session_id", sessionId);
        payload.put("selected_wine", request.getSelectedWine() != null ? request.getSelectedWine() : null);
        payload.put("selected_menu", request.getSelectedMenu() != null ? request.getSelectedMenu() : null);
        payload.put("user_id", user.getId());
        payload.put("stream", true);
        payload.put("mentioned_friends", List.of());

        StringBuilder fullTextForStorage = new StringBuilder();
        StringBuilder cardJsonForStorage = new StringBuilder();
        StringBuilder actionsJsonForStorage = new StringBuilder();
        String finalSessionId = sessionId;

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

                    return Flux.fromArray(rawChunk.split("\n"))
                            .map(String::trim)
                            .filter(line -> !line.isEmpty() && !line.startsWith("event:"))
                            .map(line -> {
                                try {
                                    String jsonData = line;
                                    if (line.startsWith("data:")) {
                                        jsonData = line.substring(5).trim();
                                    }

                                    if ("[DONE]".equals(jsonData)) {
                                        return line;
                                    }

                                    JsonNode root = objectMapper.readTree(jsonData);
                                    String content = root.path("content").asText("");
                                    if (!content.isEmpty()) {
                                        fullTextForStorage.append(content);
                                    }

                                    JsonNode cardNode = root.get("card");
                                    if (cardNode != null && !cardNode.isNull()) {
                                        cardJsonForStorage.setLength(0);
                                        cardJsonForStorage.append(cardNode.toString());
                                    }

                                    JsonNode actionsNode = root.get("actions");
                                    if (actionsNode != null && actionsNode.isArray() && actionsNode.size() > 0) {
                                        actionsJsonForStorage.setLength(0);
                                        actionsJsonForStorage.append(actionsNode.toString());
                                    }
                                } catch (Exception exception) {
                                    log.warn("AI stream parsing failed. line={}, error={}", line, exception.getMessage());
                                }
                                return line;
                            });
                })
                .doOnComplete(() -> {
                    if (fullTextForStorage.length() > 0) {
                        chatMessageRepository.save(
                                ChatMessage.builder()
                                        .sessionId(finalSessionId)
                                        .user(user)
                                        .role("assistant")
                                        .content(fullTextForStorage.toString())
                                        .cardJson(cardJsonForStorage.length() > 0 ? cardJsonForStorage.toString() : null)
                                        .actionsJson(actionsJsonForStorage.length() > 0 ? actionsJsonForStorage.toString() : null)
                                        .build()
                        );
                    }
                });
    }

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

        log.info(
                "AI refine response status={}, data={}",
                response != null ? response.getStatus() : "null",
                response != null ? response.getData() : "null"
        );

        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChatHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return chatMessageRepository.findByUserOrderByCreatedAtAsc(user)
                .stream()
                .map(ChatResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChatHistoryBySessionId(String email, String sessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .filter(message -> message.getUser().getId().equals(user.getId()))
                .map(ChatResponse::from)
                .collect(Collectors.toList());
    }
}
