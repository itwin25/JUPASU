package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.preference.entity.Preference;
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
        Integer reviewCount,
        Integer star5Count,
        Integer star4Count,
        Integer star3Count,
        Integer star2Count,
        Integer star1Count,
        Integer price,
        String description,
        Float sweetness,
        Float acidity,
        Float body,
        Float tannin,
        Integer matchRate,
        List<String> pairingFoods,
        UserPreferenceResponse userPreference
) {
    public static WineDetailResponse of(
            Wine wine,
            Integer matchRate,
            List<String> pairingFoods,
            Preference preference
    ) {
        Double averageRating = 0.0;
        Integer reviewCount = 0;
        Integer star5Count = 0;
        Integer star4Count = 0;
        Integer star3Count = 0;
        Integer star2Count = 0;
        Integer star1Count = 0;

        if (wine.getRatingSummary() != null) {
            averageRating = wine.getRatingSummary().getDisplayAverageRating();
            reviewCount = wine.getRatingSummary().getDisplayReviewCount();
            star5Count = wine.getRatingSummary().getDisplayStar5Count();
            star4Count = wine.getRatingSummary().getDisplayStar4Count();
            star3Count = wine.getRatingSummary().getDisplayStar3Count();
            star2Count = wine.getRatingSummary().getDisplayStar2Count();
            star1Count = wine.getRatingSummary().getDisplayStar1Count();
        } else if (wine.getPriceAndRating() != null) {
            averageRating = wine.getPriceAndRating().getAverageRating();
        }

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
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .star5Count(star5Count)
                .star4Count(star4Count)
                .star3Count(star3Count)
                .star2Count(star2Count)
                .star1Count(star1Count)
                .price(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getPrice() : 0)
                .description(wine.getDescription())
                .sweetness(wine.getTasteProfile() != null ? wine.getTasteProfile().getSweetness() : 0.0f)
                .acidity(wine.getTasteProfile() != null ? wine.getTasteProfile().getAcidity() : 0.0f)
                .body(wine.getTasteProfile() != null ? wine.getTasteProfile().getBody() : 0.0f)
                .tannin(wine.getTasteProfile() != null ? wine.getTasteProfile().getTannin() : 0.0f)
                .matchRate(matchRate)
                .pairingFoods(pairingFoods)
                .userPreference(preference != null ? UserPreferenceResponse.from(preference) : null)
                .build();
    }
}