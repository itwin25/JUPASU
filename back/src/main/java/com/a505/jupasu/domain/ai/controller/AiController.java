package com.a505.jupasu.domain.ai.controller;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.request.RefineRequest;
import com.a505.jupasu.domain.ai.dto.response.ChatResponse;
import com.a505.jupasu.domain.ai.dto.response.RefineResponse;
import com.a505.jupasu.domain.ai.service.AiService;
import com.a505.jupasu.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

/**
 * [AI 통합 컨트롤러]
 * 채팅(chat)과 정제(refine)라는 두 가지 핵심 기능만 노출합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * OCR 결과 정제 API (라벨/메뉴판 공통)
     * RefineRequest 내의 task 필드로 구분 (LABEL_SCAN, MENU_SCAN)
     */
    @PostMapping("/refine")
    public ApiResponse<RefineResponse> refine(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RefineRequest request
    ) {
        log.info("정제 요청 수신: task={}, user={}", request.getTask(), userDetails.getUsername());
        return ApiResponse.success(aiService.refine(request, userDetails.getUsername()));
    }

    /**
     * 소믈리에 챗봇 채팅 내역 조회
     */
    @GetMapping("/chat/history")
    public ApiResponse<List<ChatResponse>> getChatHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "session_id", required = false) String sessionId
    ) {
        if (sessionId != null && !sessionId.isBlank()) {
            return ApiResponse.success(aiService.getChatHistoryBySessionId(userDetails.getUsername(), sessionId));
        }

        return ApiResponse.success(aiService.getChatHistory(userDetails.getUsername()));
    }

    @PostMapping("/chat")
    public SseEmitter chat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request
    ) {
        String email = userDetails.getUsername();
        log.info("🚀 채팅 SSE 연결 시작: user={}", email);

        SseEmitter emitter = new SseEmitter(300000L); // 5분 타임아웃
        
        aiService.chat(request, email)
                .doOnNext(data -> {
                    log.info("📤 컨트롤러 전송 데이터: {}", data);
                    try {
                        // event name을 제거하고 순수 데이터만 전송 (data: 접두어는 SseEmitter가 자동 생성)
                        emitter.send(data);
                    } catch (Exception e) {
                        log.error("❌ SSE 전송 중 예외: {}", e.getMessage());
                    }
                })
                .doOnError(error -> {
                    log.error("❌ 스트림 에러 발생: {}", error.getMessage());
                    emitter.completeWithError(error);
                })
                .doOnComplete(() -> {
                    try {
                        log.info("✅ SSE 스트림 완료 전송");
                        emitter.send(SseEmitter.event().data("[DONE]"));
                        emitter.complete();
                    } catch (IOException e) {
                        log.error("❌ SSE 완료 전송 실패: {}", e.getMessage());
                    }
                })
                .subscribe(); // 비동기 실행 시작

        return emitter;
    }
}
