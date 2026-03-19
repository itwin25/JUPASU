package com.a505.jupasu.domain.ai.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [Spring 초보자 가이드]
 * DTO(Data Transfer Object): 데이터 전송을 위한 객체입니다. 
 * 프론트엔드에서 보내온 JSON 데이터를 이 자바 객체로 변환해서 받습니다.
 */
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String message;
    
    // [추가] 사용자가 DB 검색 결과 중 최종 선택한 와인의 상세 정보
    private Map<String, Object> selectedWine;
}
