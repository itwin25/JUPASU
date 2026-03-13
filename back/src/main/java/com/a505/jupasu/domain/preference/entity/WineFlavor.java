package com.a505.jupasu.domain.preference.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 선호 맛/향 Enum
 */
@Getter
@RequiredArgsConstructor
public enum WineFlavor {
    FRUIT("과일향"),
    FLOWER("꽃향"),
    BERRY("베리향"),
    SPICE("스파이스"),
    OAK("오크");

    private final String description;
}
