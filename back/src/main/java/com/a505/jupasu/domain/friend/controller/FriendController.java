package com.a505.jupasu.domain.friend.controller;

import com.a505.jupasu.domain.friend.dto.request.FriendInviteRequest;
import com.a505.jupasu.domain.friend.dto.request.FriendResponseRequest;
import com.a505.jupasu.domain.friend.dto.response.FriendListResponse;
import com.a505.jupasu.domain.friend.dto.response.FriendPendingResponse;
import com.a505.jupasu.domain.friend.entity.FriendStatus;
import com.a505.jupasu.domain.friend.service.FriendService;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
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
     * @param request 친구 신청 대상자의 닉네임을 담은 DTO
     * @return 성공 메시지를 포함한 ApiResponse
     */
    @PostMapping("/invite")
    public ApiResponse<Void> inviteFriend(@RequestBody FriendInviteRequest request) {
        User requester = userRepository.findById(1L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        friendService.inviteFriend(requester, request.getReceiverNickname());

        return ApiResponse.success("친구 요청을 성공적으로 보냈습니다.");
    }

    /**
     * 받은 친구 요청에 대해 수락 또는 거절
     *
     * @param request 친구 요청 ID와 상태(ACCEPTED/REJECTED)를 담은 DTO
     * @return 성공 메시지
     */
    @PatchMapping("/accept")
    public ApiResponse<Void> respondFriendRequest(@RequestBody FriendResponseRequest request) {
        User loginUser = userRepository.findById(3L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        friendService.respondToFriendRequest(loginUser, request);

        String message = request.getStatus() == FriendStatus.ACCEPTED ? "친구 신청을 수락했습니다." : "친구 신청을 거절했습니다.";
        return ApiResponse.success(message);
    }

    /**
     * 정식 친구 목록 조회
     *
     * @return 친구 목록 데이터를 포함한 ApiResponse
     */
    @GetMapping
    public ApiResponse<List<FriendListResponse>> getFriendList() {
        User loginUser = userRepository.findById(3L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        List<FriendListResponse> friendList = friendService.getFriendList(loginUser);

        return ApiResponse.success(friendList);
    }

    /**
     * 받은 친구 요청 목록 조회
     *
     * @return 요청 목록 데이터를 포함한 ApiResponse
     */
    @GetMapping("/pending")
    public ApiResponse<List<FriendPendingResponse>> getPendingRequests() {
        User loginUser = userRepository.findById(3L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return ApiResponse.success(friendService.getPendingFriendList(loginUser));
    }
}
