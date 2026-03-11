package com.a505.jupasu.domain.friend.dto.response;

import com.a505.jupasu.domain.friend.entity.Friend;
import com.a505.jupasu.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 친구 목록 조회를 위한 응답 DTO
 */
@Getter
@AllArgsConstructor
public class FriendListResponse {
    private String nickname;
    private String character;
    private LocalDateTime friendSince;

    public FriendListResponse(Friend friend, User me) {
        User other = friend.getOtherUser(me);
        this.nickname = other.getNickname();
        this.character = other.getCharacter();
        this.friendSince = friend.getCreatedAt();
    }
}
