package com.a505.jupasu.domain.friend.controller;

import com.a505.jupasu.domain.friend.dto.request.FriendInviteRequest;
import com.a505.jupasu.domain.friend.service.FriendService;
import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.CustomException;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;
    private final UserRepository userRepository;

    @PostMapping("/invite")
    public ApiResponse<Void> inviteFriend(@RequestBody FriendInviteRequest request) {
        User requester = userRepository.findById(1L)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        friendService.inviteFriend(requester, request.getReceiverNickname());

        return ApiResponse.success("친구 요청을 성공적으로 보냈습니다.");
    }

}
