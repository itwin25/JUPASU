package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WineSearchResponse {
    private Long id;
    private String nameKr;
    private String nameEn;
    private WineType type;
    private String country;
    private Double averageRating;
    private Integer price;
    private String imageUrl;

    public static WineSearchResponse from(Wine wine) {
        return WineSearchResponse.builder()
                .id(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .type(wine.getType())
                .country(wine.getCountry())
                .averageRating(wine.getAverageRating())
                .price(wine.getPrice())
                .imageUrl(wine.getImageUrl())
                .build();
    }
}
