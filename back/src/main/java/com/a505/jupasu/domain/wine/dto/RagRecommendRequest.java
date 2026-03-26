package com.a505.jupasu.domain.wine.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
public class RagRecommendRequest {
    // 파이썬 AI 서버가 넘겨주는 30개의 와인 ID 리스트
    private List<Long> candidateWineIds;
    // 추후 확장될 친구 ID 리스트 (없으면 빈 배열)
    private List<Long> friendIds;
    // 유저 ID
    private Long userId;
}
