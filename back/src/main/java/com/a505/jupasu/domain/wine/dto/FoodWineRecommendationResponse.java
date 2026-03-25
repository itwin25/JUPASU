package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

@Builder
public record FoodWineRecommendationResponse(
        String foodText,
        RecommendedWine recommendedWine,
        String reason,
        Integer matchPercent
) {
    @Builder
    public record RecommendedWine(
            Long wineId,
            String nameKr,
            String nameEn,
            String wineType,
            String wineTypeLabel,
            String country,
            String region,
            Integer price,
            String imageUrl,
            String detailUrl
    ) {
    }
}
