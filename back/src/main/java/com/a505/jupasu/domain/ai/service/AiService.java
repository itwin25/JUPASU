package com.a505.jupasu.domain.ai.service;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.request.RefineRequest;
import com.a505.jupasu.domain.ai.dto.response.ChatResponse;
import com.a505.jupasu.domain.ai.dto.response.RefineResponse;
import com.a505.jupasu.domain.ai.entity.ChatMessage;
import com.a505.jupasu.domain.ai.repository.ChatMessageRepository;
import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.util.WineRecommendationCalculator;
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

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AiService {

    private final WebClient webClient;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final WineRecommendationCalculator wineRecommendationCalculator;
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

        // --- 친구 및 그룹 취향 통합 로직 ---
        List<Map<String, Object>> friendsWithPrefs = new ArrayList<>();
        List<Preference> allPreferences = new ArrayList<>();
        
        // 1. 본인 취향 추가
        preferenceRepository.findByUserId(user.getId()).ifPresent(allPreferences::add);

        // 2. 언급된 친구들 취향 조회 및 데이터 구성
        if (request.getMentionedFriends() != null) {
            for (Map<String, Object> friendMap : request.getMentionedFriends()) {
                try {
                    Object idObj = friendMap.get("id");
                    if (idObj == null) continue;
                    Long friendId = Long.valueOf(idObj.toString());
                    
                    Map<String, Object> friendData = new HashMap<>(friendMap);
                    preferenceRepository.findByUserId(friendId).ifPresent(p -> {
                        allPreferences.add(p);
                        // 개별 친구 취향 데이터 담기 (AI의 답변 생성용)
                        Map<String, Object> pMap = new HashMap<>();
                        pMap.put("sweetness", p.getSweetness());
                        pMap.put("acidity", p.getAcidity());
                        pMap.put("body", p.getBody());
                        pMap.put("tannin", p.getTannin());
                        friendData.put("preference", pMap);
                    });
                    friendsWithPrefs.add(friendData);
                } catch (Exception e) {
                    log.warn("친구 취향 조회 중 오류 발생: {}", e.getMessage());
                }
            }
        }

        // 3. 그룹 통합 컨텍스트 계산 (리스크 회피 로직 포함)
        Map<String, Object> groupContext = wineRecommendationCalculator.calculateGroupContext(allPreferences);

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", request.getMessage());
        payload.put("history", history);
        payload.put("session_id", sessionId);
        payload.put("selected_wine", request.getSelectedWine());
        payload.put("selected_menu", request.getSelectedMenu());
        payload.put("user_id", user.getId());
        payload.put("user_nickname", user.getNickname()); // 추가: 사용자 본인 닉네임
        payload.put("stream", true);
        payload.put("mentioned_friends", friendsWithPrefs);
        payload.put("group_context", groupContext);


        StringBuilder fullTextForStorage = new StringBuilder();
        StringBuilder cardJsonForStorage = new StringBuilder();
        StringBuilder actionsJsonForStorage = new StringBuilder();
        String finalSessionId = sessionId;

        return webClient.post()
                .uri("/v1/chat/stream")
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
                                String jsonData = line;
                                if (line.startsWith("data:")) {
                                    jsonData = line.substring(5).trim();
                                }

                                if ("[DONE]".equals(jsonData)) {
                                    return jsonData;
                                }

                                try {
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
                                return jsonData;
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
