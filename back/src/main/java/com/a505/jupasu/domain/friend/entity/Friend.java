package com.a505.jupasu.domain.friend.entity;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.global.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 간의 친구 관계 및 요청 정보를 저장하는 엔티티
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "friends")
public class Friend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    /**
     * 친구 요청을 보낸 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    /**
     * 친구 요청을 받은 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    /**
     * 현재 친구 요청의 상태 (PENDING, ACCEPTED, REJECTED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendStatus status;

    /**
     * 친구를 맺은 날짜
     */
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public Friend(User requester, User receiver, FriendStatus status) {
        this.requester = requester;
        this.receiver = receiver;
        this.status = status;
    }

    /**
     * 친구 요청 수락
     */
    public void accept() {
        this.status = FriendStatus.ACCEPTED;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * 친구 요청 거절
     */
    public void reject() {
        this.status = FriendStatus.REJECTED;
    }


}
