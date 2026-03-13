package com.a505.jupasu.domain.preference.repository;

import com.a505.jupasu.domain.preference.entity.Preference;
import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Preference 엔티티에 대한 데이터 접근 기능을 담당하는 리포지토리
 */
public interface PreferenceRepository extends JpaRepository<Preference,Long> {

    // 특정 유저 취향 정보 조회
    Optional<Preference> findByUserId(Long userId);

}
