package com.a505.jupasu.domain.wine.util;

import com.a505.jupasu.domain.wine.entity.WineType;
import org.springframework.util.StringUtils;

public class WineDataParser {

    public static Object[] parsePrice(String rawPrice) {
        if (!StringUtils.hasText(rawPrice) || rawPrice.equalsIgnoreCase("N/A")) {
            return new Object[]{0, false};
        }
        try {
            String numeric = rawPrice.replaceAll("[^0-9]", "");
            return new Object[]{Integer.parseInt(numeric), true};
        } catch (Exception e) {
            return new Object[]{0, false};
        }
    }

    public static Object[] parseTaste(String rawPercent) {
        if (!StringUtils.hasText(rawPercent)) {
            return new Object[]{3.0f, false}; // 결측치 3.0 처리 및 가짜(false) 마킹
        }
        try {
            String numeric = rawPercent.replaceAll("[^0-9.]", "");
            float val = Float.parseFloat(numeric);
            return new Object[]{val / 20.0f, true}; // 100분율을 5점 만점으로 환산
        } catch (Exception e) {
            return new Object[]{3.0f, false};
        }
    }

    public static Object[] parseAlcohol(String rawAlcohol) {
        if (!StringUtils.hasText(rawAlcohol)) {
            return new Object[]{13.0f, false}; // 결측치 평균 도수 13.0 처리
        }
        String cleaned = rawAlcohol.toLowerCase();
        if (cleaned.contains("non-alcoholic") || cleaned.equals("0%")) {
            return new Object[]{0.0f, true};
        }
        try {
            String numeric = rawAlcohol.replaceAll("[^0-9.]", "");
            return new Object[]{Float.parseFloat(numeric), true};
        } catch (Exception e) {
            return new Object[]{13.0f, false};
        }
    }

    public static WineType parseType(String rawType) {
        if (!StringUtils.hasText(rawType)) return WineType.RED;
        String type = rawType.toUpperCase();
        if (type.contains("RED")) return WineType.RED;
        if (type.contains("WHITE")) return WineType.WHITE;
        if (type.contains("SPARK")) return WineType.SPARKLING;
        if (type.contains("ROSE")) return WineType.ROSE;
        if (type.contains("DESSERT")) return WineType.DESSERT;
        if (type.contains("FORTIFIED")) return WineType.FORTIFIED;
        return WineType.RED;
    }
}