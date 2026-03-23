package com.a505.jupasu.domain.wine.dto;

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

    public static WineRecommendationItem of(Wine wine, Integer matchRate){
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
     *   display = round(100 / (1 + exp(−k · (s − μ_base))))
     *   s       = rawScore / 100
     *   μ_base  = 0.58  (가우시안 모델의 이론적 랜덤 기대값 → 중립점 50%)
     *   k       = 10    (경사도: 점수 차이 0.1당 약 20%p 변화)
     * </pre>
     *
     * 주요 변환값:
     * <ul>
     *   <li>원점수 58 (랜덤 기대값) → 50%</li>
     *   <li>원점수 70 → 약 77%</li>
     *   <li>원점수 80 → 약 92%</li>
     *   <li>원점수 40 → 약 17%</li>
     * </ul>
     */
    private static int sigmoid(int rawScore) {
        double s = rawScore / 100.0;
        return (int) Math.round(100.0 / (1.0 + Math.exp(-10.0 * (s - 0.58))));
    }
}
