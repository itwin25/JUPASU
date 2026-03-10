package com.a505.jupasu.domain.friend.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 친구 신청을 위한 요청 DTO
 */
@Getter
@NoArgsConstructor
public class FriendInviteRequest {
    private String receiverNickname;
}
