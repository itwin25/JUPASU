package com.a505.jupasu.domain.ai.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RefineRequest {
    /**
     * LABEL_SCAN 또는 MENU_SCAN
     */
    private String task;
    
    /**
     * 프론트엔드와는 textContent(Camel Case)로 통신합니다.
     */
    private String textContent;
}
