package com.a505.jupasu.domain.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiService {

    private final WebClient aiWebClient;

    public String chat(String message) {
        // OpenAI-like message format for the AI server's ChatCompletionRequest
        Map<String, Object> messageObj = new HashMap<>();
        messageObj.put("role", "user");
        messageObj.put("content", message);

        Map<String, Object> request = new HashMap<>();
        request.put("model", "gpt-4o-mini");
        request.put("messages", Collections.singletonList(messageObj));

        // Let's assume the AI server returns a ChatCompletionResponse and we extract the content
        Map response = aiWebClient.post()
                .uri("/v1/chat/completions")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("choices")) {
            List choices = (List) response.get("choices");
            if (!choices.isEmpty()) {
                Map firstChoice = (Map) choices.get(0);
                Map choiceMessage = (Map) firstChoice.get("message");
                return (String) choiceMessage.get("content");
            }
        }
        return "응답을 생성할 수 없습니다.";
    }

    public OcrResponse ocrMenu(MultipartFile file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());

        return aiWebClient.post()
                .uri("/v1/vision/ocr/menu")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(OcrResponse.class)
                .block();
    }

    public OcrResponse ocrLabel(MultipartFile file) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", file.getResource());

        return aiWebClient.post()
                .uri("/v1/vision/ocr/label")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(OcrResponse.class)
                .block();
    }
}
