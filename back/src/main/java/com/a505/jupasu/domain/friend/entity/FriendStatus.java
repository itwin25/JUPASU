package com.a505.jupasu.domain.friend.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 친구 요청 처리 상태 (요청 중, 친구, 거절)
 */
@Getter
@AllArgsConstructor
public enum FriendStatus {
    NONE(""),
    PENDING("요청 중"),
    ACCEPTED("친구"),
    REJECTED("거절");

    private final String description;
}