package com.a505.jupasu.domain.report.entity;

import com.a505.jupasu.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
}
