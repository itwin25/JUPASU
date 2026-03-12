package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.Data;

@Data
public class WineSearchCondition {

    private String keyword;     //(선택적) 와인 이름
    private WineType type;
    private Integer minPrice;
    private Integer maxPrice;
    private Double minRate;
    private String country;

}
