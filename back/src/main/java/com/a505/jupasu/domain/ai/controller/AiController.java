package com.a505.jupasu.domain.ai.controller;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.response.OcrResponse;
import com.a505.jupasu.domain.ai.service.AiService;
import com.a505.jupasu.global.common.ApiResponse;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

/**
 * [Spring 초보자 가이드]
 * OpenAI 표준 규격의 SSE 스트리밍을 제공하는 컨트롤러입니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * OCR 이미지 분석 API
     */
    @PostMapping("/ocr")
    public ApiResponse<OcrResponse> ocr(@RequestParam("file") MultipartFile file) {
        log.info("OCR 분석 요청을 받았습니다.");
        return ApiResponse.success(aiService.ocr(file));
    }

    /**
     * LLM 챗봇 스트리밍 API (OpenAI 표준 규격)
     */
    @PostMapping("/chat")
    public SseEmitter streamChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request
    ) {
        String email = userDetails.getUsername();
        log.info("사용자 {} 님의 OpenAI 표준 챗봇 요청", email);
        
        SseEmitter emitter = new SseEmitter(30000L);

        aiService.streamChat(request, email)
                .subscribe(
                        data -> {
                            try {
                                // 데이터 조각 전송 (이미 "data: " 접두사가 포함되어 있다고 가정하거나 직접 추가)
                                // OpenAI 규격을 그대로 중계하므로 별도의 가공 없이 전송합니다.
                                emitter.send(SseEmitter.event().data(data));
                            } catch (IOException e) {
                                log.error("데이터 전송 중 오류: {}", e.getMessage());
                            }
                        },
                        error -> {
                            log.error("스트리밍 중 에러: {}", error.getMessage());
                            try {
                                emitter.send(SseEmitter.event().name("error").data(ErrorCode.AI_SERVER_ERROR.getMessage()));
                            } catch (IOException e) {
                                log.error("에러 메시지 전송 실패: {}", e.getMessage());
                            }
                            emitter.completeWithError(error);
                        },
                        () -> {
                            try {
                                // [OpenAI 표준 종료 신호 전송]
                                emitter.send(SseEmitter.event().data("[DONE]"));
                                log.info("OpenAI 표준 스트리밍 완료 ([DONE] 전송)");
                            } catch (IOException e) {
                                log.error("종료 신호 전송 실패: {}", e.getMessage());
                            }
                            emitter.complete();
                        }
                );

        emitter.onCompletion(() -> log.info("연결 종료"));
        emitter.onTimeout(() -> {
            log.warn("연결 시간 초과");
            try {
                emitter.send(SseEmitter.event().name("error").data(ErrorCode.AI_PROCESSING_TIMEOUT.getMessage()));
            } catch (IOException e) {
                log.error("타임아웃 메시지 전송 실패: {}", e.getMessage());
            }
            emitter.complete();
        });

        return emitter;
    }
}
