package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.response.HybridSearchResponse;
import com.a505.jupasu.domain.wine.dto.response.WineSearchSimilarityResponse;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WineSearchService {

    private final WineRepository wineRepository;

    /**
     * PostgreSQL pg_trgm 유사도 기반 와인 검색
     */
    public List<WineSearchSimilarityResponse> searchBySimilarity(String keyword) {
        // 기본 임계값 0.3 적용
        return wineRepository.searchBySimilarity(keyword, 0.3)
                .stream()
                .map(WineSearchSimilarityResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 하이브리드 와인 검색 (유사도 검색 + 맛 기반 추천)
     */
    public HybridSearchResponse searchHybrid(String keyword) {
        List<Wine> searchResults = wineRepository.searchBySimilarity(keyword, 0.3);

        if (searchResults.isEmpty()) {
            return HybridSearchResponse.builder()
                    .bestMatch(null)
                    .recommendations(Collections.emptyList())
                    .build();
        }

        Wine bestMatch = searchResults.get(0);
        List<Wine> recommendations = wineRepository.findSimilarTastes(bestMatch, 3);

        return HybridSearchResponse.builder()
                .bestMatch(WineSearchSimilarityResponse.from(bestMatch))
                .recommendations(recommendations.stream()
                        .map(WineSearchSimilarityResponse::from)
                        .collect(Collectors.toList()))
                .build();
    }
}
