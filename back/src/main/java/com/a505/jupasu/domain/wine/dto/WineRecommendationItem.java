package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;

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
        String style
) {
    public static WineRecommendationItem of(Wine wine, Integer matchRate, String recommendationReason) {
        var tp = wine.getTasteProfile();
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .imageUrl(wine.getImageUrl())
                .matchRate(sigmoid(matchRate))
                .recommendationReason(recommendationReason)
                .sweetness(tp != null && Boolean.TRUE.equals(tp.getIsRealSweetness()) ? tp.getSweetness() : null)
                .acidity(tp != null && Boolean.TRUE.equals(tp.getIsRealAcidity()) ? tp.getAcidity() : null)
                .body(tp != null && Boolean.TRUE.equals(tp.getIsRealBody()) ? tp.getBody() : null)
                .tannin(tp != null && Boolean.TRUE.equals(tp.getIsRealTannin()) ? tp.getTannin() : null)
                .style(wine.getStyle())
                .build();
    }

    public static WineRecommendationItem of(Wine wine, Integer matchRate) {
        return of(wine, matchRate, (DrinkingSituation) null);
    }

    public static WineRecommendationItem of(Wine wine, Integer matchRate, DrinkingSituation situation) {
        var tp = wine.getTasteProfile();
        return WineRecommendationItem.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .imageUrl(wine.getImageUrl())
                .matchRate(sigmoid(matchRate))
                .recommendationReason("")
                .sweetness(tp != null && Boolean.TRUE.equals(tp.getIsRealSweetness()) ? tp.getSweetness() : null)
                .acidity(tp != null && Boolean.TRUE.equals(tp.getIsRealAcidity()) ? tp.getAcidity() : null)
                .body(tp != null && Boolean.TRUE.equals(tp.getIsRealBody()) ? tp.getBody() : null)
                .tannin(tp != null && Boolean.TRUE.equals(tp.getIsRealTannin()) ? tp.getTannin() : null)
                .style(wine.getStyle())
                .build();
    }

    /**
     * 원점수(0~100)를 Sigmoid 변환으로 표시용 매칭률로 변환한다.
     *
     * <pre>
     *   display = round(100 / (1 + exp(−k · (s − μ))))
     *   s = rawScore / 100
     *   μ = 0.35  (50% 중립점: 원점수 35 이하는 50% 미만으로 표시)
     *   k = 7     (경사도: μ 기준 ±0.1마다 약 15%p 변화)
     * </pre>
     *
     * 추천 시스템에서 실제로 반환되는 top-5 와인의 원점수는 약 55~85 범위이며,
     * 이 구간이 80~97%로 매핑되어 사용자에게 신뢰감 있는 점수를 제공한다.
     * 상대적 순위(ranking)는 sigmoid의 단조증가 특성으로 원점수와 동일하게 보존된다.
     *
     * <ul>
     *   <li>원점수 55 → 약 80%</li>
     *   <li>원점수 65 → 약 89%</li>
     *   <li>원점수 75 → 약 94%</li>
     *   <li>원점수 85 → 약 97%</li>
     * </ul>
     */
    private static int sigmoid(int rawScore) {
        double s = rawScore / 100.0;
        return (int) Math.round(100.0 / (1.0 + Math.exp(-7.0 * (s - 0.35))));
    }
}
