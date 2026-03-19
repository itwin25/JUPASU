package com.a505.jupasu.domain.wine.controller;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.service.DummyDataInitService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dummy")
@RequiredArgsConstructor
public class DummyController {

    private final DummyDataInitService dummyService;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/user")
    public String createTestUser() {
        if (userRepository.existsByEmail("test@test.com")) {
            return "이미 테스트 유저가 존재합니다. [이메일: test@test.com / 비밀번호: Test1234!]";
        }

        User user = User.builder()
                .email("test@test.com")
                .passwordHash(passwordEncoder.encode("Test1234!"))
                .nickname("테스트계정")
                .character("sommelier_fox")
                .build();

        userRepository.save(user);
        return "✅ 테스트 유저 생성 완료! [이메일: test@test.com / 비밀번호: Test1234!]";
    }

    @PostMapping("/wines")
    public String insertDummy() {
        dummyService.generateDummyData();
        return "더미 생성 시작! 콘솔 로그를 확인하세요.";
    }

}