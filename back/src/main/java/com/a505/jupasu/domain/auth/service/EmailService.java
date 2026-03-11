package com.a505.jupasu.domain.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    /**
     * OTP 이메일 비동기 발송
     *
     * @Async + spring.threads.virtual.enabled=true → 가상 스레드에서 실행
     */
    @Async
    public void sendOtpEmail(String to, String code) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject("[Jupasu] 이메일 인증 코드");
            helper.setText(buildEmailBody(code), false);

            javaMailSender.send(message);
            log.info("OTP 이메일 발송 완료: {}", to);

        } catch (MessagingException e) {
            // 비동기 실패 — 사용자에게 에러 전달 불가. 로그만 기록하고 Redis 키는 유지.
            // 유저는 메일이 안 오면 '재전송' 버튼을 눌러 재시도할 수 있다.
            log.error("OTP 이메일 발송 실패 (수신자: {}): {}", to, e.getMessage());
        }
    }

    private String buildEmailBody(String code) {
        return """
                안녕하세요, 주파수입니다.
                아래의 6자리 인증 코드를 입력창에 입력해주세요.

                %s

                이 코드는 5분간 유효합니다.
                본인이 요청하지 않은 경우 이 이메일을 무시해주세요.
                """.formatted(code);
    }
}
