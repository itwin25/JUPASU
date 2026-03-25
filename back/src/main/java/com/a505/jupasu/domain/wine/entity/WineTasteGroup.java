package com.a505.jupasu.domain.wine.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WineTasteGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wine_taste_group_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wine_id")
    private Wine wine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "taste_group_id")
    private TasteGroup tasteGroup;

    @Builder
    public WineTasteGroup(Wine wine, TasteGroup tasteGroup) {
        this.wine = wine;
        this.tasteGroup = tasteGroup;
    }
}