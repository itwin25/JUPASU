package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.preference.dto.response.PreferenceResponse;
import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
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
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WineService {

    private final WineRepository wineRepository;
    private final UserRepository userRepository;
    private final PreferenceRepository preferenceRepository;
    private final WineFoodPairingRepository wineFoodPairingRepository;

    public Page<WineSearchResponse> searchWines(WineSearchCondition condition, Pageable pageable) {
        List<Long> matchingIds = null;

        // ⭐️ getKeyword() -> keyword() 로 변경
        if (StringUtils.hasText(condition.keyword())) {
            matchingIds = wineRepository.findMatchingIdsByKeyword(condition.keyword());

            if (matchingIds.isEmpty()) {
                return Page.empty(pageable);
            }
        }

        Page<Wine> wines = wineRepository.searchWines(condition, matchingIds, pageable);
        return wines.map(WineSearchResponse::from);
    }

    public WineDetailResponse getWineDetail(Long userId, Long wineId) {
        // 1. 와인 정보 조회
        Wine wine = wineRepository.findById(wineId)
                .orElseThrow(() -> new CustomException(ErrorCode.WINE_NOT_FOUND));


        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
      
        Preference preference = preferenceRepository.findByUserId(userId).orElse(null);

        // 3. 페어링 푸드 목록 조회
        List<String> pairingFoods = wineFoodPairingRepository.findFoodNamesByWineId(wineId);

        // 4. 취향 적중률 계산 현재는 95 고정
        //TODO: 취향 적중률 로직 추후 추가 예정
        int matchRate = 95;


        return WineDetailResponse.of(wine, matchRate, pairingFoods, preference);
    }
}