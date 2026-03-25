package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

@Builder
public record FoodWineRecommendationContext(
        Long userId,
        String foodText,
        FoodContext foodContext,
        int candidateLimit,
        FoodWinePersonalizationSnapshot personalization
) {
}
