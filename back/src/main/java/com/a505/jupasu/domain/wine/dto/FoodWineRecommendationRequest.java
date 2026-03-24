package com.a505.jupasu.domain.wine.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record FoodWineRecommendationRequest(
        @NotBlank(message = "음식 텍스트는 비어 있을 수 없습니다.")
        String foodText,

        @Min(value = 1, message = "후보 개수는 1 이상이어야 합니다.")
        @Max(value = 50, message = "후보 개수는 50 이하여야 합니다.")
        Integer candidateLimit
) {
    public int resolvedCandidateLimit() {
        return candidateLimit == null ? 20 : candidateLimit;
    }
}
