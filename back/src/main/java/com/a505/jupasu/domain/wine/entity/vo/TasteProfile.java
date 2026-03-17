package com.a505.jupasu.domain.wine.entity.vo;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter @Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TasteProfile {
    @Builder.Default
    private Float sweetness = 0.0f;
    @Builder.Default
    private Boolean isRealSweetness = false;

    @Builder.Default
    private Float acidity = 0.0f;
    @Builder.Default
    private Boolean isRealAcidity = false;

    @Builder.Default
    private Float body = 0.0f; // Vivino의 boldness
    @Builder.Default
    private Boolean isRealBody = false;

    @Builder.Default
    private Float tannin = 0.0f;
    @Builder.Default
    private Boolean isRealTannin = false;
}