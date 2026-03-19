package com.a505.jupasu.domain.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<String> chat(@RequestBody ChatRequest request) {
        String response = aiService.chat(request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ocr/menu")
    public ResponseEntity<OcrResponse> ocrMenu(@RequestParam("file") MultipartFile file) {
        OcrResponse response = aiService.ocrMenu(file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/ocr/label")
    public ResponseEntity<OcrResponse> ocrLabel(@RequestParam("file") MultipartFile file) {
        OcrResponse response = aiService.ocrLabel(file);
        return ResponseEntity.ok(response);
    }
}
