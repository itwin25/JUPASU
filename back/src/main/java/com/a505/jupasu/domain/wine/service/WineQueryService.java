package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 와인 조회 전담 서비스.
 * wineRepository.findAll() 결과를 JVM 인메모리 캐시("wines")에 보관하여
 * 매 추천 요청마다 발생하는 전체 테이블 스캔을 방지한다.
 */
@Service
@RequiredArgsConstructor
public class WineQueryService {

    private final WineRepository wineRepository;

    /**
     * 전체 와인 목록을 반환한다. 캐시가 존재하면 DB를 조회하지 않는다.
     */
    @Cacheable(value = "wines", cacheManager = "localCacheManager")
    @Transactional(readOnly = true)
    public List<Wine> getAllWines() {
        return wineRepository.findAll();
    }

    /**
     * 와인 데이터가 변경된 후 캐시를 무효화한다.
     */
    @CacheEvict(value = "wines", allEntries = true, cacheManager = "localCacheManager")
    public void evictWinesCache() {}
}
