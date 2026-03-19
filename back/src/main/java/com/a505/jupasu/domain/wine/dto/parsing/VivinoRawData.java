package com.a505.jupasu.domain.wine.dto.parsing;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public record VivinoRawData(
        @JsonProperty("wine_name") String wineName,
        @JsonProperty("name_kr") String nameKr,
        String winery,
        String country,
        String region,
        Map<String, Double> ratings,
        String price,
        String type,
        String grapes,
        String alcohol,
        @JsonProperty("taste_profile") Map<String, String> tasteProfile,
        String description,
        // 로컬 이미지 경로 (bottle 키를 가짐)
        @JsonProperty("local_image_path") Map<String, String> localImagePath
) {
}