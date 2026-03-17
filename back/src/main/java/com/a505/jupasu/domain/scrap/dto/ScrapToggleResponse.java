package com.a505.jupasu.domain.scrap.dto;

import lombok.Builder;
import lombok.Getter;

@Builder
public record ScrapToggleResponse(
        boolean isScrapped
) {
}