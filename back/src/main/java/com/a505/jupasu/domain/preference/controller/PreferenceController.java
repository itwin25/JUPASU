package com.a505.jupasu.domain.preference.controller;

import com.a505.jupasu.domain.preference.dto.request.PreferenceUpdateRequest;
import com.a505.jupasu.domain.preference.service.PreferenceService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
public class PreferenceController {
    private final PreferenceService preferenceService;

    /**
     * 현재 로그인한 사용자의 와인 취향 정보를 수정
     * @param loginUser 인증된 현재 사용자
     * @param request   수정할 취향 데이터 DTO
     * @return 성공 메시지
     */
    @PatchMapping
    public ApiResponse<Void> updatePreference(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestBody PreferenceUpdateRequest request) {

        preferenceService.updatePreference(loginUser.getUser(), request);

        return ApiResponse.success("취향 정보가 성공적으로 저장되었습니다.");
    }
}
