package com.a505.jupasu.domain.user.controller;

import com.a505.jupasu.domain.user.dto.response.UserMyPageResponse;
import com.a505.jupasu.domain.user.service.UserService;
import com.a505.jupasu.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 사용자 정보와 관련된 HTTP 요청을 처리하는 컨트롤러 클래스
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 마이페이지에 필요한 내 프로필 및 활동 정보를 조회
     *
     * @return 마이페이지 상세 데이터를 포함한 ApiResponse
     */
    @GetMapping("/me")
    public ApiResponse<UserMyPageResponse> getMyPage() {
        UserMyPageResponse userInfo = userService.getMyPageInfo();
        return ApiResponse.success(userInfo);
    }
}
