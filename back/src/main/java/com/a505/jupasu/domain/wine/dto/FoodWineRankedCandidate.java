package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

@Builder
public record FoodWineRankedCandidate(
        FoodWineSearchCandidate candidate,
        FoodWineScoreBreakdown scoreBreakdown
) {
}
