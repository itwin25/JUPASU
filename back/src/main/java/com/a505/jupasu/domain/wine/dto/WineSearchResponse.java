package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.Builder;

@Builder
public record WineSearchResponse(
        Long id,
        String nameKr,
        String nameEn,
        WineType type,
        String country,
        Double averageRating,
        Integer price,
        String imageUrl
) {
    public static WineSearchResponse from(Wine wine) {
        return WineSearchResponse.builder()
                .id(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .type(wine.getType())
                .country(wine.getOrigin() != null ? wine.getOrigin().getCountry() : null)
                .averageRating(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getAverageRating() : 0.0)
                .price(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getPrice() : 0)
                .imageUrl(wine.getImageUrl())
                .build();
    }
}