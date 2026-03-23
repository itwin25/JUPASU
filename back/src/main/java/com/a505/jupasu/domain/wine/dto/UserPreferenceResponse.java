package com.a505.jupasu.domain.wine.dto;

import com.a505.jupasu.domain.preference.entity.Preference;

public record UserPreferenceResponse(
        Integer tannin,
        Integer body,
        Integer alcoholDegree,
        Integer sweetness,
        Integer acidity
) {
    public static UserPreferenceResponse from(Preference pref) {
        return new UserPreferenceResponse(
                pref.getTannin(), pref.getBody(), pref.getAbv(), pref.getSweetness(), pref.getAcidity()
        );
    }
}
