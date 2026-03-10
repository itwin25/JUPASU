package com.a505.jupasu.domain.friend.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 친구 요청 처리 상태 (요청 중, 수락, 거절)
 */
@Getter
@AllArgsConstructor
public enum FriendStatus {
    PENDING("요청 중"),
    ACCEPTED("수락"),
    REJECTED("거절");

    private final String description;
}