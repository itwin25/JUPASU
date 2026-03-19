package com.a505.jupasu.domain.wine.entity.vo;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Origin {
    private String country;
    @Builder.Default
    private Boolean isRealCountry = false;

    private String region;
    @Builder.Default
    private Boolean isRealRegion = false;

    private String winery;
    @Builder.Default
    private Boolean isRealWinery = false;
}