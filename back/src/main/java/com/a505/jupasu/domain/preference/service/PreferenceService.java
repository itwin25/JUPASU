package com.a505.jupasu.domain.preference.service;

import com.a505.jupasu.domain.preference.dto.request.PreferenceUpdateRequest;
import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.preference.repository.PreferenceRepository;
import com.a505.jupasu.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사용자의 와인 취향 정보에 대한 비즈니스 로직을 처리하는 서비스 클래스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PreferenceService {

    private final PreferenceRepository preferenceRepository;

    /**
     * 사용자의 취향 정보를 업데이트하거나, 정보가 없는 경우 새롭게 생성
     * * @param user    현재 인증된 사용자 엔티티 (Controller에서 @AuthenticationPrincipal로 전달받음)
     * @param request 수정할 취향 데이터가 담긴 DTO
     * @see Preference#updatePreference 엔티티 내 업데이트 도메인 로직
     */
    @Transactional
    public void updatePreference(User user, PreferenceUpdateRequest request) {
        Preference preference = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> Preference.builder().user(user).build());

        preference.updatePreference(
                request.getSweetness(),
                request.getAcidity(),
                request.getBody(),
                request.getTannin(),
                request.getAbv(),
                request.getPreferredPriceMin(),
                request.getPreferredPriceMax(),
                null, // preferSummary는 추후 AI 로직에서 처리
                request.getPreferredTypes(),
                request.getPreferredFlavors(),
                request.getDrinkingSituations()
        );

        preference.markReportAsOutdated();
        preferenceRepository.save(preference);
    }
}
