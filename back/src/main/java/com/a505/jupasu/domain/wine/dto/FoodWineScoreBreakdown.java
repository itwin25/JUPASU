package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

@Builder
public record FoodWineScoreBreakdown(
        double finalScore,
        double foodScore,
        double preferenceScore,
        double directPairingScore,
        Double typeScore,
        Double flavorScore,
        Double priceScore,
        Double bodyScore,
        Double acidityScore,
        Double tanninScore,
        Double sweetnessScore,
        Double alcoholScore
) {
}
