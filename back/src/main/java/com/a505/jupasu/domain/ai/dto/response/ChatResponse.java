package com.a505.jupasu.domain.ai.dto.response;

import com.a505.jupasu.domain.ai.entity.ChatMessage;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private Long id;
    private String role;
    private String content;
    private LocalDateTime createdAt;

    public static ChatResponse from(ChatMessage msg) {
        return ChatResponse.builder()
                .id(msg.getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
