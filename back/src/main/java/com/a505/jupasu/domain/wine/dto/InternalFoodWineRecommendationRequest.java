package com.a505.jupasu.domain.wine.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record InternalFoodWineRecommendationRequest(
        @NotBlank(message = "foodText is required.")
        String foodText,

        Integer candidateLimit,

        @NotBlank(message = "queryVector is required.")
        String queryVector
) {
    public FoodWineRecommendationRequest toFoodRequest() {
        return FoodWineRecommendationRequest.builder()
                .foodText(foodText)
                .candidateLimit(candidateLimit)
                .build();
    }
}
