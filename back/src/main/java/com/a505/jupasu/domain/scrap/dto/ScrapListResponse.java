package com.a505.jupasu.domain.scrap.dto;

import com.a505.jupasu.domain.scrap.entity.WineScrap;
import com.a505.jupasu.domain.wine.entity.Wine;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 마이페이지 스크랩 목록 조회 시 사용하는 응답 DTO
 * 이미지 UI의 가격, 평점, 일치도 등을 모두 포함
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapListResponse {
    private Long wineId;
    private Long scrapId;
    private String wineName;
    private String wineType;
    private Double averageRating;
    private Integer price;
    private Integer matchRate;
    private String country;
    private String imageUrl;

    @Builder.Default
    private boolean isScraped = true;

    /**
     * Scrap 엔티티를 DTO로 변환하는 정적 팩토리 메서드
     */
    public static ScrapListResponse from(WineScrap scrap) {
        Wine wine = scrap.getWine();
        return ScrapListResponse.builder()
                .wineId(wine.getId())
                .scrapId(scrap.getId())
                .wineName(wine.getNameKr() != null ? wine.getNameKr() : wine.getNameEn())
                .wineType(wine.getType().toString())
                .averageRating(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getAverageRating() : 0.0)
                .price(wine.getPriceAndRating() != null ? wine.getPriceAndRating().getPrice() : 0)
                .matchRate(95) // TODO: 추후 추천 알고리즘 연동 (현재는 임시값)
                .country(wine.getOrigin() != null ? wine.getOrigin().getCountry() : null)
                .imageUrl(wine.getImageUrl())
                .isScraped(true)
                .build();
    }
}
