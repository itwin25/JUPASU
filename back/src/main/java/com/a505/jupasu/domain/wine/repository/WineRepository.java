package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.entity.Wine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WineRepository extends JpaRepository<Wine, Long> {
    // 키워드가 포함된 와인 검색 (임시 구현)
    List<Wine> findByNameKrContainingOrNameEnContainingIgnoreCase(String nameKr, String nameEn);
}
