package com.a505.jupasu.domain.user.repository;

import com.a505.jupasu.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일로 유저 조회
    Optional<User> findByEmail(String email);

    // 이메일 중복 여부 확인
    boolean existsByEmail(String email);

    // 닉네임 중복 여부 확인
    boolean existsByNickname(String nickname);

    // 해당 닉네임의 유저 존재 여부 확인
    Optional<User> findByNickname(String nickname);

    // 닉네임에 특정 키워드가 포함된 유저 조회
    List<User> findByNicknameContainingAndIdNot(String nickname, Long excludeId);
}
