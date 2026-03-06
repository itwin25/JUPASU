package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WineSearchResponse {
    private Long id;
    private String nameKr;
    private String nameEn;
    private String country;
    private Integer averagePrice;
    private String imageUrl;

    public static WineSearchResponse from(Wine wine) {
        return WineSearchResponse.builder()
                .id(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .country(wine.getCountry())
                .averagePrice(wine.getAveragePrice())
                .imageUrl(wine.getImageUrl())
                .build();
    }
}
