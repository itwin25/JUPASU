package com.a505.jupasu.domain.wine.dto.parsing;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VivinoRawData(
        @JsonProperty("wine_name") String wineName,
        @JsonProperty("name_kr") String nameKr,
        String winery,
        String country,
        String region,
        @JsonProperty("wine_type") String wineType,
        String price,
        String description,
        @JsonProperty("top_3_taste_groups_kr")
        List<String> top3TasteGroupsKr,

        @JsonProperty("food_pairings") List<String> foodPairings,

        @JsonProperty("all_facts") Map<String, String> allFacts,
        @JsonProperty("taste_profile") Map<String, String> tasteProfile,
        Map<String, Object> ratings,
        @JsonProperty("local_image_paths") Map<String, String> localImagePaths
) {
}