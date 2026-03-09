package com.a505.jupasu.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * USER JPA 엔티티
 *
 */
@Entity
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_users_email", columnNames = "email"),
                @UniqueConstraint(name = "uq_users_nickname", columnNames = "nickname")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    /** 사용자 고유 ID (PK) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    /** 이메일 */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /** 비밀번호 해시값 (BCrypt) */
    @Column(name = "password_hash")
    private String passwordHash;

    /** 닉네임 (unique) */
    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    /** 선호 가격대 최소 */
    @Column(name = "preferred_price_min")
    private Integer preferredPriceMin;

    /** 선호 가격대 최대 (원) */
    @Column(name = "preferred_price_max")
    private Integer preferredPriceMax;

    /** 단맛 선호도 (0~10) */
    @Column(name = "taste_sweetness")
    private Integer tasteSweetness;

    /** 산미 선호도 (0~10) */
    @Column(name = "taste_acidity")
    private Integer tasteAcidity;

    /** 바디감 선호도 (0~10) */
    @Column(name = "taste_body")
    private Integer tasteBody;

    /** 타닌 선호도 (0~10) */
    @Column(name = "taste_tannin")
    private Integer tasteTannin;

    /** 선호 도수 (%) */
    @Column(name = "taste_alcohol")
    private Float tasteAlcohol;

    /** 캐릭터 유형 */
    @Column(name = "character", length = 50)
    private String character;

    /** 리뷰 수 */
    @Column(name = "review_count")
    private Integer reviewCount;

    /** 유저 취향 요약 텍스트 */
    @Column(name = "prefer_summary", columnDefinition = "TEXT")
    private String preferSummary;

    /** 가입 일시 */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 엔티티 저장 직전에 createdAt을 현재 시각으로 자동 설정 */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        // review_count 기본값 설정
        if (this.reviewCount == null) {
            this.reviewCount = 0;
        }
    }

    /**
     * 회원가입(이메일) 용 Builder.
     * 취향 정보(taste_*, preferred_price_*)는 회원가입 후 별도로 업데이트합니다.
     */
    @Builder
    public User(String email, String passwordHash, String nickname, String character) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.character = character;
    }
}

