package com.a505.jupasu.domain.ai.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SommelierRequest {
    // 작업 타입: LABEL_SCAN, MENU_SCAN, CHAT
    private String task;
    
    // 온디바이스 OCR 결과 텍스트 (Optional)
    private String textContent;

    // 스트리밍 여부 (기본값 false)
    @Builder.Default
    private boolean stream = false;
}
