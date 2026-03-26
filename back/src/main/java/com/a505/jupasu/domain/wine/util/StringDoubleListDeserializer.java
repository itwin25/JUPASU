package com.a505.jupasu.domain.wine.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * JSON 내의 "[0.1, 0.2, ...]" 형태의 문자열 배열을 List<Double>로 변환하는 Deserializer
 */
public class StringDoubleListDeserializer extends JsonDeserializer<List<Double>> {
    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public List<Double> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String value = p.getValueAsString();
        if (value == null || value.isBlank() || "[]".equals(value.trim())) {
            return new ArrayList<>();
        }

        try {
            // 문자열이 "[...]" 형식이면 내부 배열만 파싱 시도
            return mapper.readValue(value, new TypeReference<List<Double>>() {});
        } catch (Exception e) {
            // 파싱 실패 시 빈 리스트 반환 (로그 기록은 생략하거나 추가 가능)
            return new ArrayList<>();
        }
    }
}
