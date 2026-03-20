package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import lombok.Builder;

import java.util.List;

@Builder
public record WineQuickRecommendResponse(
        List<WineRecommendationItem> general,
        List<SituationResult> bySituation
) {
    @Builder
    public record SituationResult(
            DrinkingSituation situation,
            String situationName,
            List<WineRecommendationItem> recommendations
    ) {
        public static SituationResult of(DrinkingSituation situation, List<WineRecommendationItem> recommendations) {
            return SituationResult.builder()
                    .situation(situation)
                    .situationName(situation.getDescription())
                    .recommendations(recommendations)
                    .build();
        }
    }

    public static WineQuickRecommendResponse of(List<WineRecommendationItem> general, List<SituationResult> bySituation) {
        return WineQuickRecommendResponse.builder()
                .general(general)
                .bySituation(bySituation)
                .build();
    }
}
