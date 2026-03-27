package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record FoodWineSearchCandidate(
        Long wineId,
        String nameKr,
        String nameEn,
        String wineType,
        String country,
        String region,
        Integer price,
        String imageUrl,
        Double body,
        Double acidity,
        Double tannin,
        Double sweetness,
        String richDescription,
        List<String> foodPairings,
        Double foodSimilarity
) {
}
