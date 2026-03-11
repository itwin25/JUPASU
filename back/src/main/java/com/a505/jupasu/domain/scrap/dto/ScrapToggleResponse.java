package com.a505.jupasu.domain.scrap.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ScrapToggleResponse {
    private boolean isScrapped;
}
