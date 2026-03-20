package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.WineType;

public record WineSearchCondition(
        String keyword,
        WineType type,
        Integer minPrice,
        Integer maxPrice,
        Double minRate
) {
}