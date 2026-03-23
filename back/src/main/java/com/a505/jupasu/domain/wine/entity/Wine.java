package com.a505.jupasu.domain.wine.entity;

import com.a505.jupasu.domain.wine.entity.vo.Origin;
import com.a505.jupasu.domain.wine.entity.vo.RatingSummary;
import com.a505.jupasu.domain.wine.entity.vo.TasteProfile;
import com.a505.jupasu.domain.wine.entity.vo.WinePriceAndRating;
import com.a505.jupasu.global.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Wine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이름은 메인 정보이므로 엔티티에 유지
    private String nameKr;
    @Builder.Default private Boolean isRealNameKr = false;

    private String nameEn;
    @Builder.Default private Boolean isRealNameEn = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WineType type;

    // ⭐️ VO들을 Embedded로 선언
    @Embedded
    private Origin origin;

    @Embedded
    private TasteProfile tasteProfile;

    @Embedded
    private WinePriceAndRating priceAndRating;

    @Embedded
    @Builder.Default
    private RatingSummary ratingSummary = RatingSummary.builder().build();

    private String grapeVariety;

    @Builder.Default
    private Float alcoholDegree = 0.0f;
    @Builder.Default
    private Boolean isRealAlcoholDegree = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String style;

    private String imageUrl;

    public void initializeExternalRatings(
            double externalAverageRating,
            int externalRatingCount,
            int star1,
            int star2,
            int star3,
            int star4,
            int star5
    ) {
        this.ratingSummary.initializeExternal(
                externalAverageRating, externalRatingCount,
                star1, star2, star3, star4, star5
        );
        this.priceAndRating.updateAverageRating(this.ratingSummary.getDisplayAverageRating());
    }

    public void addUserReviewRating(int rating) {
        this.ratingSummary.addUserRating(rating);
        this.priceAndRating.updateAverageRating(this.ratingSummary.getDisplayAverageRating());
    }

    public void updateUserReviewRating(int oldRating, int newRating) {
        this.ratingSummary.updateUserRating(oldRating, newRating);
        this.priceAndRating.updateAverageRating(this.ratingSummary.getDisplayAverageRating());
    }

    public void removeUserReviewRating(int rating) {
        this.ratingSummary.removeUserRating(rating);
        this.priceAndRating.updateAverageRating(this.ratingSummary.getDisplayAverageRating());
    }
}
