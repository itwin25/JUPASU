package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.WineSearchResponse;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WineService {

    private final WineRepository wineRepository;

    public List<WineSearchResponse> searchWines(String keyword) {
        List<Wine> wines;
        if (keyword == null || keyword.trim().isEmpty()) {
            wines = wineRepository.findAll(); // 추후 페이징 처리 권장
        } else {
            wines = wineRepository.findByNameKrContainingOrNameEnContainingIgnoreCase(keyword, keyword);
        }

        return wines.stream()
                .map(WineSearchResponse::from)
                .collect(Collectors.toList());
    }
}