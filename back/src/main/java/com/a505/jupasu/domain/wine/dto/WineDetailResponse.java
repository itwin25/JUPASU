package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;

import java.util.List;

@Builder
public record WineDetailResponse(
        Long wineId,
        String nameKr,
        String nameEn,
        String imageUrl,
        String country,
        String region,
        String winery,
        String grapeVariety,
        Float alcoholDegree,
        Double averageRating,
        Integer price,
        String description,
        Float sweetness,
        Float acidity,
        Float body,
        Float tannin,
        Integer matchRate,
        List<String> pairingFoods
) {
    public static WineDetailResponse of(Wine wine, Integer matchRate, List<String> pairingFoods) {
        return WineDetailResponse.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .imageUrl(wine.getImageUrl())
                .country(wine.getOrigin() != null ? wine.getOrigin().getCountry() : null)
                .region(wine.getOrigin() != null ? wine.getOrigin().getRegion() : null)
                .winery(wine.getOrigin() != null ? wine.getOrigin().getWinery() : null)
                .grapeVariety(wine.getGrapeVariety())
                .alcoholDegree(wine.getAlcoholDegree())
                .averageRating(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getAverageRating() : 0.0)
                .price(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getPrice() : 0)
                .description(wine.getDescription())
                .sweetness(wine.getTasteProfile() != null ? wine.getTasteProfile().getSweetness() : 0.0f)
                .acidity(wine.getTasteProfile() != null ? wine.getTasteProfile().getAcidity() : 0.0f)
                .body(wine.getTasteProfile() != null ? wine.getTasteProfile().getBody() : 0.0f)
                .tannin(wine.getTasteProfile() != null ? wine.getTasteProfile().getTannin() : 0.0f)
                .matchRate(matchRate)
                .pairingFoods(pairingFoods)
                .build();
    }
}