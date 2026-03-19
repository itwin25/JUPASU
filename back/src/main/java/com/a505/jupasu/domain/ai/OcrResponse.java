package com.a505.jupasu.domain.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResponse {
    private boolean success;
    private List<Map<String, Object>> results;
    private Object refined;
    private String type;
}
