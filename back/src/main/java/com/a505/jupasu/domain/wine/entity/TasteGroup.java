package com.a505.jupasu.domain.wine.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TasteGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "taste_group_id")
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Builder
    public TasteGroup(String name) {
        this.name = name;
    }
}