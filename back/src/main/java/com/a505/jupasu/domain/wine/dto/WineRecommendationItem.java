package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;

@Builder
public record WineRecommendationItem(
        Long wineId,
        String nameKr,
        Integer matchRate,
        String recommendationReason
) {
    public static WineRecommendationItem of(Wine wine, Integer matchRate, String recommendationReason) {
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .matchRate(50 + matchRate/2)
                .recommendationReason(recommendationReason)
                .build();
    }

    public static WineRecommendationItem of(Wine wine, Integer matchRate){
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .matchRate(50 + matchRate/2)
                .recommendationReason("")
                .build();
    }
}
