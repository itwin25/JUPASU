package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.entity.Wine;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WineRepository extends JpaRepository<Wine, Long>, WineRepositoryCustom, WineSearchRepositoryCustom {
    // 키워드가 포함된 와인 검색 (임시 구현)
    List<Wine> findByNameKrContainingOrNameEnContainingIgnoreCase(String nameKr, String nameEn);

    @Query(value =
            "SELECT id FROM wine " +
                    "WHERE :keyword <% name_kr " +
                    "ORDER BY word_similarity(:keyword, name_kr) DESC " +
                    "LIMIT 100", nativeQuery = true)
    List<Long> findMatchingIdsByKeyword(@Param("keyword") String keyword);
}
