package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;

@Builder
public record SimilarWineResponse(
        Long wineId,
        String nameKr,
        String nameEn,
        String imageUrl,
        String country,
        String grapeVariety,
        Double averageRating,
        Integer price
) {
    public static SimilarWineResponse from(Wine wine) {
        Double averageRating = 0.0;
        Integer price = 0;

        if (wine.getRatingSummary() != null) {
            averageRating = wine.getRatingSummary().getDisplayAverageRating();
        } else if (wine.getPriceAndRating() != null) {
            averageRating = wine.getPriceAndRating().getAverageRating();
        }

        if (wine.getPriceAndRating() != null) {
            price = wine.getPriceAndRating().getPrice();
        }

        return SimilarWineResponse.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .imageUrl(wine.getImageUrl())
                .country(wine.getOrigin() != null ? wine.getOrigin().getCountry() : null)
                .grapeVariety(wine.getGrapeVariety())
                .averageRating(averageRating)
                .price(price)
                .build();
    }
}
