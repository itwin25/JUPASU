package com.a505.jupasu.domain.wine.entity;

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

    @Column(nullable = false)
    private String nameKr;

    private String nameEn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WineType type;

    private String country;

    private String region;

    private String winery;

    private String grapeVariety;

    @Builder.Default
    private Float sweetness = 0.0f;

    @Builder.Default
    private Float acidity = 0.0f;

    @Builder.Default
    private Float body = 0.0f;

    @Builder.Default
    private Float tannin = 0.0f;

    private Float alcoholDegree;

    private Integer price;

    private Double averageRating;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String summary;

    private String imageUrl;
}
