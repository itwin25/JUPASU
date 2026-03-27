package com.a505.jupasu.domain.wine.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class RagRecommendRequest {
    // [추가] 파이썬 AI 서버가 넘겨주는 질문 텍스트의 임베딩 벡터 (JSON 문자열 형태 추천)
    private String queryVector;

    // [추가] 감지된 와인 타입 필터 (RED, WHITE 등)
    private String wineType;

    // 파이썬 AI 서버가 넘겨주는 30개의 와인 ID 리스트 (벡터 검색을 백엔드에서 할 경우 선택사항이 됨)
    private List<Long> candidateWineIds;
    // 추후 확장될 친구 ID 리스트 (없으면 빈 배열)
    private List<Long> friendIds;
    // 유저 ID
    private Long userId;
}
