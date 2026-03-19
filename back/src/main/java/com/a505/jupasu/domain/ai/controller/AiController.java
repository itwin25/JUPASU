package com.a505.jupasu.domain.ai.controller;

import com.a505.jupasu.domain.ai.dto.request.ChatRequest;
import com.a505.jupasu.domain.ai.dto.request.SommelierRequest;
import com.a505.jupasu.domain.ai.service.AiService;
import com.a505.jupasu.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.a505.jupasu.global.common.ApiResponse;
import java.util.Map;
import java.io.IOException;

/**
 * [Spring 초보자 가이드]
 * 고도화된 통합 AI 서비스를 제공하는 컨트롤러입니다.
 * 이미지(서버 OCR) 또는 텍스트(온디바이스 OCR) 입력을 모두 지원합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * 와인 라벨 분석 API (독립 실행, 결과: JSON)
     * 이미지 또는 이미 추출된 텍스트 모두 지원합니다.
     */
    @PostMapping(value = "/label", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> scanLabel(
            @RequestPart(value = "request", required = false) SommelierRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        String text = (request != null) ? request.getTextContent() : null;
        log.info("독립적 와인 라벨 분석 요청 (Text: {}, File: {})", (text != null), (file != null));
        return ApiResponse.success(aiService.scanLabel(text, file));
    }

    /**
     * 메뉴판 분석 API (독립 실행, 결과: JSON)
     * 이미지 또는 이미 추출된 텍스트 모두 지원합니다.
     */
    @PostMapping(value = "/menu", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> scanMenu(
            @RequestPart(value = "request", required = false) SommelierRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        String text = (request != null) ? request.getTextContent() : null;
        log.info("독립적 메뉴판 분석 요청 (Text: {}, File: {})", (text != null), (file != null));
        return ApiResponse.success(aiService.scanMenu(text, file));
    }

    /**
     * 소믈리에 챗봇 API (결과: SSE 스트리밍)
     * OCR 분석 결과를 textContent에 담아 보낼 수 있습니다.
     */
    @PostMapping(value = "/chat")
    public SseEmitter streamChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatRequest request
    ) {
        String email = userDetails.getUsername();
        log.info("사용자 {} 님의 소믈리에 채팅 요청", email);

        SseEmitter emitter = new SseEmitter(300000L);
        aiService.processSommelierStream("CHAT", request.getMessage(), null, email)
                .subscribe(
                        data -> {
                            try { emitter.send(SseEmitter.event().data(data)); }
                            catch (IOException e) { log.error("SSE 전송 실패"); }
                        },
                        error -> emitter.completeWithError(error),
                        () -> {
                            try { emitter.send(SseEmitter.event().data("[DONE]")); } catch (IOException e) {}
                            emitter.complete();
                        }
                );
        return emitter;
    }
}
