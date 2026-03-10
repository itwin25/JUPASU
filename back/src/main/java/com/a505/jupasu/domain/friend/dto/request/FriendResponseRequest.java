package com.a505.jupasu.domain.friend.dto.request;

import com.a505.jupasu.domain.friend.entity.FriendStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 친구 요청에 대한 응답(수락/거절)을 위한 DTO
 */
@Getter
@NoArgsConstructor
public class FriendResponseRequest {

    private Long friendId;
    private FriendStatus status;
}
