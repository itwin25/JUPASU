package com.a505.jupasu.domain.wine.service;

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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class WineSearchServiceTest {

    @Mock
    private WineRepository wineRepository;

    @InjectMocks
    private WineSearchService wineSearchService;

    @Test
    @DisplayName("유사도 기반 와인 검색 테스트")
    void searchBySimilarityTest() {
        // given
        String keyword = "Montes";
        Wine wine = Wine.builder()
                .id(1L)
                .nameEn("Montes Alpha Cabernet Sauvignon")
                .type(WineType.RED)
                .origin(Origin.builder().winery("Montes").build())
                .imageUrl("test-url")
                .build();
        
        given(wineRepository.searchBySimilarity(anyString(), anyDouble()))
                .willReturn(List.of(wine));

        // when
        List<WineSearchSimilarityResponse> result = wineSearchService.searchBySimilarity(keyword);

        // then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNameEn()).isEqualTo("Montes Alpha Cabernet Sauvignon");
        assertThat(result.get(0).getWinery()).isEqualTo("Montes");
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }
}
