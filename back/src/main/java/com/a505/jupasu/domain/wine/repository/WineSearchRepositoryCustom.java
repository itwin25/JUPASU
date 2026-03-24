package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.entity.Wine;
import java.util.List;

public interface WineSearchRepositoryCustom {
    List<Wine> searchBySimilarity(String keyword, Double threshold);
    List<Wine> findSimilarTastes(Wine target, int limit);
}
