package com.a505.jupasu.domain.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String message;
    
    @JsonProperty("selected_wine")
    private Map<String, Object> selectedWine;

    @JsonProperty("selected_menu")
    private Map<String, Object> selectedMenu;
}
