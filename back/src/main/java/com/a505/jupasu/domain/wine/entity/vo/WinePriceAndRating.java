package com.a505.jupasu.domain.wine.entity.vo;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class WinePriceAndRating {
    @Builder.Default
    private Integer price = 0;
    @Builder.Default
    private Boolean isRealPrice = false;

    @Builder.Default
    private Double averageRating = 0.0;
    @Builder.Default
    private Boolean isRealRating = false;
}