package com.a505.jupasu.domain.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefineResponse {
    private String status;
    private Object data;
    private String provider;
    
    @JsonProperty("raw_input")
    private String rawInput;
}
