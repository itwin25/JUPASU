package com.a505.jupasu.domain.user.controller;

import com.a505.jupasu.domain.user.dto.request.UserUpdateRequest;
import com.a505.jupasu.domain.user.dto.response.UserMyPageResponse;
import com.a505.jupasu.domain.user.dto.response.UserSearchResponse;
import com.a505.jupasu.domain.user.service.UserService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * @param loginUser 인증된 현재 사용자
     * @return 마이페이지 상세 데이터를 포함한 ApiResponse
     */
    @GetMapping("/me")
    public ApiResponse<UserMyPageResponse> getMyPage(@AuthenticationPrincipal LoginUserCustom loginUser) {
        UserMyPageResponse userInfo = userService.getMyPageInfo(loginUser.getUser());
        return ApiResponse.success(userInfo);
    }

    /**
     * 내 프로필 정보 수정
     *
     * @param loginUser 인증된 현재 사용자
     * * @param request 수정할 정보를 담은 DTO
     * @return 성공 메시지
     */
    @PatchMapping("/me")
    public ApiResponse<Void> updateMyPage(@AuthenticationPrincipal LoginUserCustom loginUser,
                                          @RequestBody UserUpdateRequest request) {

        userService.updateMyPageInfo(loginUser.getUser(), request);
        return ApiResponse.success("프로필 정보 수정에 성공했습니다.");
    }

    /**
     * 닉네임으로 유저를 검색하고, 현재 로그인한 유저와의 친구 상태를 포함하여 반환
     *
     * * @param nickname    검색 키워드
     * @param loginUser 현재 로그인한 유저 엔티티
     * @return 친구 상태가 포함된 검색 결과 리스트
     */
    @GetMapping("/search")
    public ApiResponse<List<UserSearchResponse>> searchUsers(
            @AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestParam String nickname) {

        if (nickname == null || nickname.length() < 2) {
            throw new CustomException(ErrorCode.INVALID_SEARCH_KEYWORD);
        }

        List<UserSearchResponse> results = userService.searchUsers(nickname, loginUser.getUser());

        return  ApiResponse.success(results);
    }
}
