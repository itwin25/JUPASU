package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;

import java.util.List;

@Builder
public record WineRecommendationItem(
        Long wineId,
        String nameKr,
        String imageUrl,
        Integer matchRate,
        String recommendationReason,
        Float sweetness,
        Float acidity,
        Float body,
        Float tannin,
        String style,
        Integer price,
        Double rating,
        List<String> pairingFoods
) {
    public static WineRecommendationItem of(Wine wine, Integer matchRate, String recommendationReason, List<String> pairingFoods) {
        var tp = wine.getTasteProfile();
        var pr = wine.getPriceAndRating();
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .imageUrl(wine.getImageUrl())
                .matchRate(matchRate)
                .recommendationReason(recommendationReason)
                .sweetness(tp != null && Boolean.TRUE.equals(tp.getIsRealSweetness()) ? tp.getSweetness() : null)
                .acidity(tp != null && Boolean.TRUE.equals(tp.getIsRealAcidity()) ? tp.getAcidity() : null)
                .body(tp != null && Boolean.TRUE.equals(tp.getIsRealBody()) ? tp.getBody() : null)
                .tannin(tp != null && Boolean.TRUE.equals(tp.getIsRealTannin()) ? tp.getTannin() : null)
                .style(wine.getStyle())
                .price(pr != null && Boolean.TRUE.equals(pr.getIsRealPrice()) ? pr.getPrice() : null)
                .rating(pr != null ? pr.getAverageRating() : 0.0)
                .pairingFoods(pairingFoods != null ? pairingFoods : List.of())
                .build();
    }

    public static WineRecommendationItem of(Wine wine, Integer matchRate, List<String> pairingFoods) {
        return of(wine, matchRate, (String) null, pairingFoods);
    }

    public static WineRecommendationItem of(Wine wine, Integer matchRate, DrinkingSituation situation, List<String> pairingFoods) {
        var tp = wine.getTasteProfile();
        var pr = wine.getPriceAndRating();
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .imageUrl(wine.getImageUrl())
                .matchRate(matchRate)
                .recommendationReason("")
                .sweetness(tp != null && Boolean.TRUE.equals(tp.getIsRealSweetness()) ? tp.getSweetness() : null)
                .acidity(tp != null && Boolean.TRUE.equals(tp.getIsRealAcidity()) ? tp.getAcidity() : null)
                .body(tp != null && Boolean.TRUE.equals(tp.getIsRealBody()) ? tp.getBody() : null)
                .tannin(tp != null && Boolean.TRUE.equals(tp.getIsRealTannin()) ? tp.getTannin() : null)
                .style(wine.getStyle())
                .price(pr != null && Boolean.TRUE.equals(pr.getIsRealPrice()) ? pr.getPrice() : null)
                .rating(pr != null ? pr.getAverageRating() : 0.0)
                .pairingFoods(pairingFoods != null ? pairingFoods : List.of())
                .build();
    }
}
