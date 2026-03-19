package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.entity.Wine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WineRepositoryCustom {

    /**
     *
     * @param condition 필터링 정보
     * @param pageable 페이징 정보 (page, size, sort)
     * @return 조건에 맞는 와인 데이터
     */
    Page<Wine> searchWines(WineSearchCondition condition, List<Long> matchingIds, Pageable pageable);
}
