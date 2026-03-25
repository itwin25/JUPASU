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

    private static final List<String> ALLOWED_CHARACTER_BASES =
            List.of("cat", "dog", "giraffe", "mouse", "tiger", "whale");

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
     * 비밀번호를 새로운 암호화된 값으로 변경
     */
    public void updatePassword(String encodedPassword) {
        this.passwordHash = encodedPassword;
    }

    /**
     * 리뷰 갯수 관련 로직
     */

    public void increaseReviewCount() {
        if (this.reviewCount == null) {
            this.reviewCount = 0;
        }
        this.reviewCount++;
        syncCharacterWithReviewCount();
    }

    public void decreaseReviewCount() {
        if (this.reviewCount == null || this.reviewCount <= 0) {
            this.reviewCount = 0;
            return;
        }
        this.reviewCount--;
        syncCharacterWithReviewCount();
    }


    /**
     * 사용자가 프로필에서 캐릭터를 변경할 때 호출.
     * 예: cat1.svg, cat3.svg, /cat2.svg, cat 모두 허용
     * 실제 저장은 현재 reviewCount 단계에 맞는 파일명으로 저장.
     */
    public void updateCharacter(String character) {
        String base = extractCharacterBase(character);
        this.character = buildCharacterFileName(base);
    }

    private void syncCharacterWithReviewCount() {
        String base = extractCharacterBase(this.character);
        this.character = buildCharacterFileName(base);
    }

    /**
     * character 값에서 동물 종류만 추출.
     * 허용 예:
     * - cat
     * - cat1
     * - cat1.svg
     * - /cat2.svg
     */
    private String extractCharacterBase(String character) {
        if (character == null || character.isBlank()) {
            return "tiger";
        }

        String normalized = character.trim();

        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }

        normalized = normalized.replaceAll("(?i)\\.svg$", "");
        normalized = normalized.replaceAll("[1-3]$", "");

        if (!ALLOWED_CHARACTER_BASES.contains(normalized)) {
            return "tiger";
        }

        return normalized;
    }

    /**
     * 리뷰 수 기준 단계 계산
     * 0~4   -> 1
     * 5~9   -> 2
     * 10 이상 -> 3
     */
    private int calculateCharacterStage() {
        int count = (this.reviewCount == null) ? 0 : this.reviewCount;

        if (count >= 10) {
            return 3;
        }
        if (count >= 5) {
            return 2;
        }
        return 1;
    }

    private String buildCharacterFileName(String characterBase) {
        return characterBase + calculateCharacterStage() + ".svg";
    }
}

