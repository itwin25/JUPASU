package com.a505.jupasu.domain.ai.dto.response;

import com.a505.jupasu.domain.ai.entity.ChatMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private Long id;
    private String role;
    private String content;
    private JsonNode card;
    private List<Map<String, Object>> actions;
    private LocalDateTime createdAt;

    public static ChatResponse from(ChatMessage msg) {
        return ChatResponse.builder()
                .id(msg.getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .card(parseCard(msg.getCardJson()))
                .actions(parseActions(msg.getActionsJson()))
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private static JsonNode parseCard(String cardJson) {
        if (cardJson == null || cardJson.isBlank()) {
            return null;
        }

        try {
            return OBJECT_MAPPER.readTree(cardJson);
        } catch (Exception exception) {
            return null;
        }
    }

    private static List<Map<String, Object>> parseActions(String actionsJson) {
        if (actionsJson == null || actionsJson.isBlank()) {
            return Collections.emptyList();
        }

        try {
            return OBJECT_MAPPER.readValue(actionsJson, new TypeReference<>() {});
        } catch (Exception exception) {
            return Collections.emptyList();
        }
    }
}
