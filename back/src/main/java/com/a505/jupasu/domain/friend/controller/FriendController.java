package com.a505.jupasu.domain.friend.controller;

import com.a505.jupasu.domain.friend.dto.request.FriendInviteRequest;
import com.a505.jupasu.domain.friend.dto.request.FriendResponseRequest;
import com.a505.jupasu.domain.friend.dto.response.FriendListResponse;
import com.a505.jupasu.domain.friend.dto.response.FriendPendingResponse;
import com.a505.jupasu.domain.friend.entity.FriendStatus;
import com.a505.jupasu.domain.friend.service.FriendService;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.security.auth.LoginUserCustom;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final UserRepository userRepository;

    /**
     * 닉네임을 기반으로 상대방에게 친구 초대 요청을 전송
     *
     * @param loginUser 인증된 현재 사용자
     * @param request 친구 신청 대상자의 닉네임을 담은 DTO
     * @return 성공 메시지를 포함한 ApiResponse
     */
    @PostMapping("/invite")
    public ApiResponse<Void> inviteFriend(@AuthenticationPrincipal LoginUserCustom loginUser,
                                          @RequestBody FriendInviteRequest request) {

        friendService.inviteFriend(loginUser.getUser(), request.getReceiverId());

        return ApiResponse.success("친구 요청을 성공적으로 보냈습니다.");
    }

    /**
     * 받은 친구 요청에 대해 수락 또는 거절
     *
     * @param loginUser 인증된 현재 사용자
     * @param request 친구 요청 ID와 상태(ACCEPTED/REJECTED)를 담은 DTO
     * @return 성공 메시지
     */
    @PatchMapping("/accept")
    public ApiResponse<Void> respondFriendRequest(@AuthenticationPrincipal LoginUserCustom loginUser,
            @RequestBody FriendResponseRequest request) {

        friendService.respondToFriendRequest(loginUser.getUser(), request);

        String message = request.getStatus() == FriendStatus.ACCEPTED ? "친구 신청을 수락했습니다." : "친구 신청을 거절했습니다.";
        return ApiResponse.success(message);
    }

    /**
     * 정식 친구 목록 조회
     *
     * @param loginUser 인증된 현재 사용자
     * @return 친구 목록 데이터를 포함한 ApiResponse
     */
    @GetMapping
    public ApiResponse<List<FriendListResponse>> getFriendList(@AuthenticationPrincipal LoginUserCustom loginUser) {

        List<FriendListResponse> friendList = friendService.getFriendList(loginUser.getUser());

        return ApiResponse.success(friendList);
    }

    /**
     * 받은 친구 요청 목록 조회
     *
     * @param loginUser 인증된 현재 사용자
     * @return 요청 목록 데이터를 포함한 ApiResponse
     */
    @GetMapping("/pending")
    public ApiResponse<List<FriendPendingResponse>> getPendingRequests(@AuthenticationPrincipal LoginUserCustom loginUser) {

        return ApiResponse.success(friendService.getPendingFriendList(loginUser.getUser()));
    }

    /**
     * 정식 친구를 삭제하거나 보낸 친구 신청 취소
     *
     * @param loginUser 인증된 현재 사용자
     * @param friendId 삭제할 관계의 ID
     * @return 성공 메시지를 포함한 ApiResponse
     */
    @DeleteMapping("/{friendId}")
    public ApiResponse<Void> deleteFriend(@AuthenticationPrincipal LoginUserCustom loginUser,
                                          @PathVariable Long friendId) {

        friendService.deleteFriend(loginUser.getUser(), friendId);

        return ApiResponse.success("친구 관계가 삭제되었습니다.");
    }
}
