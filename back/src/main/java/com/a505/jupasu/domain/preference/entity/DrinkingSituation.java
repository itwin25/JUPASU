package com.a505.jupasu.domain.preference.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 음용 상황 Enum
 */
@Getter
@RequiredArgsConstructor
public enum DrinkingSituation {
    GIFT("선물"),
    ALONE("혼술"),
    HOUSEWARMING("집들이"),
    PARTY("모임"),
    DATE("데이트"),
    FAMILY("가족모임");

    private final String description;
}
