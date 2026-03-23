package com.a505.jupasu.domain.report.repository;

import com.a505.jupasu.domain.report.entity.TasteReport;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * TasteReport 엔티티에 대한 데이터 액세스 계층
 */
public interface TasteReportRepository extends JpaRepository<TasteReport, Long> {

    // 유저 객체로 리포트 찾기
    Optional<TasteReport> findByUser(User user);

    // 유저의 가장 최근 리포트를 조회
    Optional<TasteReport> findTopByUserOrderByCreatedAtDesc(User user);
}
