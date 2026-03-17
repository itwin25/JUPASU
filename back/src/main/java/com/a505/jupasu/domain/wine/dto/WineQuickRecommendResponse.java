package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.user.entity.DrinkingSituation;
import lombok.Builder;

import java.util.List;

@Builder
public record WineQuickRecommendResponse(
        String situationName,
        List<WineRecommendationItem> recommendations
) {
    public static WineQuickRecommendResponse of(DrinkingSituation situation, List<WineRecommendationItem> recommendations) {
        return WineQuickRecommendResponse.builder()
                .situationName(situation.getName())
                .recommendations(recommendations)
                .build();
    }
}
