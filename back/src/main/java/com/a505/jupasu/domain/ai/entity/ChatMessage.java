package com.a505.jupasu.domain.ai.entity;

import com.a505.jupasu.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * [Spring 초보자 가이드]
 * @Entity: 이 클래스가 DB 테이블과 직접 연결되는 객체임을 나타냅니다.
 * ChatMessage 테이블이 자동으로 생성됩니다.
 */
@Entity
@Table(name = "chat_messages")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

    // 자동 증가하는 고유 번호 (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * @ManyToOne: 여러 개의 채팅 메시지가 하나의 유저에게 속함을 나타냅니다.
     * @JoinColumn: DB 외래키(FK) 이름을 user_id로 설정합니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // "user" (사용자) 또는 "assistant" (AI)
    @Column(nullable = false, length = 20)
    private String role;

    // 실제 채팅 내용 (TEXT 타입으로 길게 저장 가능)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // 메시지 생성 시각
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 저장 직전에 현재 시각 자동 입력
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public ChatMessage(User user, String role, String content) {
        this.user = user;
        this.role = role;
        this.content = content;
    }
}
