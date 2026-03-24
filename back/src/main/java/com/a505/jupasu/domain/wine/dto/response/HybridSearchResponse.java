package com.a505.jupasu.domain.wine.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HybridSearchResponse {
    private WineSearchSimilarityResponse bestMatch;
    private List<WineSearchSimilarityResponse> recommendations;
}
