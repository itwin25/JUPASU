package com.a505.jupasu.domain.user.repository;

import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 이메일 중복 여부 확인
     */
    boolean existsByEmail(String email);

    /**
     * 닉네임 중복 여부 확인
     */
    boolean existsByNickname(String nickname);
}