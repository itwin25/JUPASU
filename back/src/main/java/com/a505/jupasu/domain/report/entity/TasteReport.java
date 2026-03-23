package com.a505.jupasu.domain.report.entity;

import com.a505.jupasu.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자의 취향 분석 결과를 저장하는 엔티티
 * 특정 시점의 리뷰 및 선호도 데이터를 기반으로 생성된 리포트 정보를 보관
 */
@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TasteReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 5분면 레이더 차트 수치 (0.0 ~ 5.0)
    private Double avgSweetness;
    private Double avgAcidity;
    private Double avgBody;
    private Double avgTannin;
    private Double avgAlcohol;

    // AI 생성 텍스트 영역
    private String mainTitle;
    private String tasteTypeTag;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String bestDescription;
    private String worstDescription;

    private LocalDateTime createdAt;

    /**
     * 리포트 데이터를 한꺼번에 업데이트하는 도메인 메서드
     */
    public void updateResult(double avgSweetness, double avgAcidity, double avgBody,
                             double avgTannin, double avgAlcohol, String mainTitle, String content) {
        this.avgSweetness = avgSweetness;
        this.avgAcidity = avgAcidity;
        this.avgBody = avgBody;
        this.avgTannin = avgTannin;
        this.avgAlcohol = avgAlcohol;
        this.mainTitle = mainTitle;
        this.content = content;
    }

    /**
     * 생성 시간을 수동으로 업데이트하기 위한 Setter
     */
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
