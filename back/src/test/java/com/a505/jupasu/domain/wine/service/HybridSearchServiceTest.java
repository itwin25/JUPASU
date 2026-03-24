package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.response.HybridSearchResponse;
import com.a505.jupasu.domain.wine.dto.response.WineSearchSimilarityResponse;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import com.a505.jupasu.domain.wine.entity.vo.Origin;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class HybridSearchServiceTest {

    @Mock
    private WineRepository wineRepository;

    @InjectMocks
    private WineSearchService wineSearchService;

    @Test
    @DisplayName("하이브리드 검색 테스트 - Best Match와 추천 리스트가 있는 경우")
    void searchHybridTest() {
        // given
        String keyword = "Montes";
        Wine bestMatch = Wine.builder()
                .id(1L)
                .nameEn("Montes Alpha Cabernet Sauvignon")
                .type(WineType.RED)
                .origin(Origin.builder().winery("Montes").build())
                .build();
        
        Wine rec1 = Wine.builder().id(2L).nameEn("Rec 1").type(WineType.RED).build();
        Wine rec2 = Wine.builder().id(3L).nameEn("Rec 2").type(WineType.RED).build();
        Wine rec3 = Wine.builder().id(4L).nameEn("Rec 3").type(WineType.RED).build();

        given(wineRepository.searchBySimilarity(eq(keyword), anyDouble()))
                .willReturn(List.of(bestMatch));
        given(wineRepository.findSimilarTastes(eq(bestMatch), anyInt()))
                .willReturn(List.of(rec1, rec2, rec3));

        // when
        HybridSearchResponse result = wineSearchService.searchHybrid(keyword);

        // then
        assertThat(result.getBestMatch()).isNotNull();
        assertThat(result.getBestMatch().getNameEn()).isEqualTo("Montes Alpha Cabernet Sauvignon");
        assertThat(result.getRecommendations()).hasSize(3);
        assertThat(result.getRecommendations().get(0).getNameEn()).isEqualTo("Rec 1");
    }

    @Test
    @DisplayName("하이브리드 검색 테스트 - 검색 결과가 없는 경우")
    void searchHybridNoResultTest() {
        // given
        String keyword = "Unknown";
        given(wineRepository.searchBySimilarity(anyString(), anyDouble()))
                .willReturn(Collections.emptyList());

        // when
        HybridSearchResponse result = wineSearchService.searchHybrid(keyword);

        // then
        assertThat(result.getBestMatch()).isNull();
        assertThat(result.getRecommendations()).isEmpty();
    }
}
