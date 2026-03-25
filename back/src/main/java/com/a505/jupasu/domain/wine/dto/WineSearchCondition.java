package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.WineType;

import java.util.List;

public record WineSearchCondition(
        String keyword,
        List<WineType> types,
        Integer minPrice,
        Integer maxPrice,
        Double minRate
) {
}