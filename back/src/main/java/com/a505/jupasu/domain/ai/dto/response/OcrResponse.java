package com.a505.jupasu.domain.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [Spring 초보자 가이드]
 * AI 서버로부터 받은 OCR 분석 결과를 프론트엔드에게 돌려줄 때 사용하는 바구니입니다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResponse {
    // 이미지에서 인식된 텍스트 내용
    private String text;
}
