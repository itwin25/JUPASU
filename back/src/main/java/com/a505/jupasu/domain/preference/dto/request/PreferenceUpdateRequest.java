package com.a505.jupasu.domain.preference.dto.request;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.preference.entity.WineFlavor;
import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 사용자의 와인 취향 수정을 위한 요청 DTO 클래스
 * 모든 필드는 온보딩 시 입력을 건너뛸 수 있도록 Nullable하게 설계
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PreferenceUpdateRequest {

    // 슬라이더 값
    private Integer sweetness;
    private Integer acidity;
    private Integer body;
    private Integer tannin;
    private Integer abv;

    // 가격 범위
    private Integer preferredPriceMin;
    private Integer preferredPriceMax;

    // 다중 선택 리스트
    private List<WineType> preferredTypes;
    private List<WineFlavor> preferredFlavors;
    private List<DrinkingSituation> drinkingSituations;
}
