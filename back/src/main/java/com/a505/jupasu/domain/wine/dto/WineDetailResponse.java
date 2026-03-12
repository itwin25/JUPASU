package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class WineDetailResponse {
    private Long wineId;
    private String nameKr;
    private String nameEn;
    private String imageUrl;

    // Origin (생산지 정보)
    private String country;
    private String region;
    private String winery;

    // 상세 정보
    private String grapeVariety;
    private Float alcoholDegree;
    private Double averageRating;
    private Integer price;
    private String description;

    // 맛 지표 (Taste Profile)
    private Float sweetness;
    private Float acidity;
    private Float body;
    private Float tannin;

    // 부가 정보
    private Integer matchRate; // 취향 적중률 (%)
    private List<String> pairingFoods; // 어울리는 음식 목록

    public static WineDetailResponse of(Wine wine, Integer matchRate, List<String> pairingFoods) {
        return WineDetailResponse.builder()
                .wineId(wine.getId())
                .nameKr(wine.getNameKr())
                .nameEn(wine.getNameEn())
                .imageUrl(wine.getImageUrl())
                .country(wine.getCountry())
                .region(wine.getRegion())
                .winery(wine.getWinery())
                .grapeVariety(wine.getGrapeVariety())
                .alcoholDegree(wine.getAlcoholDegree())
                .averageRating(wine.getAverageRating())
                .price(wine.getPrice())
                .description(wine.getDescription())
                .sweetness(wine.getSweetness())
                .acidity(wine.getAcidity())
                .body(wine.getBody())
                .tannin(wine.getTannin())
                .matchRate(matchRate)
                .pairingFoods(pairingFoods)
                .build();
    }
}