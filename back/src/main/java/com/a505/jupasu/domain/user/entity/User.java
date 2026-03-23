package com.a505.jupasu.domain.user.entity;

import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.report.entity.TasteReport;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * USER JPA 엔티티
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

    // 사용자 고유 ID (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Preference preference;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TasteReport> tasteReports = new ArrayList<>();

    // 이메일
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    // 비밀번호 해시값 (BCrypt)
    @Column(name = "password_hash")
    private String passwordHash;

    // 닉네임 (unique)
    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    // 캐릭터 유형
    @Column(name = "character", length = 50)
    private String character;

    // 리뷰 수
    @Column(name = "review_count")
    private Integer reviewCount;

    // 가입 일시
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // 엔티티 저장 직전에 createdAt을 현재 시각으로 자동 설정
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        // review_count 기본값 설정
        if (this.reviewCount == null) {
            this.reviewCount = 0;
        }
    }

    /**
     * 회원가입(이메일) 용 Builder
     * 취향 정보(taste_*, preferred_price_*)는 회원가입 후 별도로 업데이트
     */
    @Builder
    public User(String email, String passwordHash, String nickname, String character) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.character = character;
    }

    /**
     * 사용자의 닉네임 변경
     * @param nickname 변경할 새 닉네임
     */
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    /**
     * 사용자의 캐릭터 키값을 변경
     * @param character 변경할 캐릭터 식별 문자열
     */
    public void updateCharacter(String character) {
        this.character = character;
    }

    /**
     * 비밀번호를 새로운 암호화된 값으로 변경
     */
    public void updatePassword(String encodedPassword) {
        this.passwordHash = encodedPassword;
    }
}

