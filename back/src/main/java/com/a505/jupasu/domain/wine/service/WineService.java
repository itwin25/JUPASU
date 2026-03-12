package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.WineDetailResponse;
import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.dto.WineSearchResponse;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineFoodPairingRepository;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WineService {

    private final WineRepository wineRepository;
    private final WineFoodPairingRepository wineFoodPairingRepository;

    public Page<WineSearchResponse> searchWines(WineSearchCondition condition, Pageable pageable) {
        Page<Wine> wines = wineRepository.searchWines(condition, pageable);
        // Entity Page -> DTO Page 로 맵핑 (map 메서드가 아주 유용합니다)
        return wines.map(WineSearchResponse::from);
    }

    public WineDetailResponse getWineDetail(Long userId, Long wineId) {
        // 1. 와인 정보 조회
        Wine wine = wineRepository.findById(wineId)
                .orElseThrow(() -> new CustomException(ErrorCode.WINE_NOT_FOUND));

        //TODO: 추후 유저 추가시 주석 해재
        // 2. 유저 정보 조회 (적중률 계산을 위함)
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 3. 페어링 푸드 목록 조회
        List<String> pairingFoods = wineFoodPairingRepository.findFoodNamesByWineId(wineId);

        // 4. 취향 적중률 계산 현재는 95 고정
        //TODO: 취향 적중률 로직 추후 추가 예정
        int matchRate = 95;

        return WineDetailResponse.of(wine, matchRate, pairingFoods);
    }
}