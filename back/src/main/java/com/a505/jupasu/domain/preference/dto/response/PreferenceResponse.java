package com.a505.jupasu.domain.preference.dto.response;

import com.a505.jupasu.domain.preference.entity.DrinkingSituation;
import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.entity.WineFlavor;
import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * 사용자의 와인 취향 정보를 전달하는 응답 DTO
 */
@Getter
@Builder
public class PreferenceResponse {
    private Integer sweetness;
    private Integer acidity;
    private Integer body;
    private Integer tannin;
    private Integer abv;
    private Integer preferredPriceMin;
    private Integer preferredPriceMax;
    private List<WineType> preferredTypes;
    private List<WineFlavor> preferredFlavors;
    private List<DrinkingSituation> drinkingSituations;

    /**
     * Preference 엔티티를 PreferenceResponse DTO로 변환
     * @param preference 변환할 취향 엔티티
     * @return 가공된 취향 응답 DTO
     */
    public static PreferenceResponse from(Preference preference) {
        if (preference == null) return null;

        return PreferenceResponse.builder()
                .sweetness(preference.getSweetness())
                .acidity(preference.getAcidity())
                .body(preference.getBody())
                .tannin(preference.getTannin())
                .abv(preference.getAbv())
                .preferredPriceMin(preference.getPreferredPriceMin())
                .preferredPriceMax(preference.getPreferredPriceMax())
                .preferredTypes(preference.getPreferredWineTypes())
                .preferredFlavors(preference.getPreferredFlavors())
                .drinkingSituations(preference.getDrinkingSituations())
                .build();
    }
}
