package com.a505.jupasu.domain.wine.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record FoodWinePersonalizationSnapshot(
        String source,
        Double sweetness,
        Double acidity,
        Double body,
        Double tannin,
        Double alcohol,
        Integer preferredPriceMin,
        Integer preferredPriceMax,
        List<String> preferredWineTypes,
        List<String> preferredFlavors,
        String summary
) {
    public boolean hasStructuredPreference() {
        return sweetness != null
                || acidity != null
                || body != null
                || tannin != null
                || alcohol != null
                || preferredPriceMin != null
                || preferredPriceMax != null
                || (preferredWineTypes != null && !preferredWineTypes.isEmpty())
                || (preferredFlavors != null && !preferredFlavors.isEmpty());
    }
}
