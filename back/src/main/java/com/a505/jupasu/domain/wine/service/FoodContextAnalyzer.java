package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.FoodContext;
import com.a505.jupasu.domain.wine.dto.FoodItem;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class FoodContextAnalyzer {

    private static final List<String> REQUEST_SUFFIXES = List.of(
            "와 어울리는 와인 추천해줘",
            "랑 어울리는 와인 추천해줘",
            "과 어울리는 와인 추천해줘",
            "와 어울리는 와인 추천",
            "랑 어울리는 와인 추천",
            "과 어울리는 와인 추천",
            "어울리는 와인 추천해줘",
            "어울리는 와인 추천",
            "어울리는 와인",
            "추천해줘",
            "추천"
    );

    private static final Pattern MULTI_SEPARATOR = Pattern.compile("\\s*(?:,|/|\\+| 그리고 | 및 )\\s*");

    public FoodContext analyze(String rawFoodText) {
        String normalizedLabel = normalizeLabel(rawFoodText);
        List<String> labels = splitFoodLabels(normalizedLabel);

        List<FoodItem> foods = labels.stream()
                .map(this::analyzeSingleFood)
                .toList();

        Set<String> combinedAttributes = new LinkedHashSet<>();
        Set<String> combinedPairingHints = new LinkedHashSet<>();
        for (FoodItem food : foods) {
            if (food.attributes() != null) {
                combinedAttributes.addAll(food.attributes());
            }
            if (food.pairingHints() != null) {
                combinedPairingHints.addAll(food.pairingHints());
            }
        }

        return FoodContext.builder()
                .originalText(rawFoodText)
                .label(normalizedLabel)
                .foods(foods)
                .attributes(combinedAttributes)
                .pairingHints(combinedPairingHints)
                .build();
    }

    private FoodItem analyzeSingleFood(String label) {
        String lowered = label.toLowerCase(Locale.ROOT);

        Set<String> attributes = new LinkedHashSet<>();
        Set<String> pairingHints = new LinkedHashSet<>();

        addIfContains(lowered, attributes, List.of("스테이크", "소고기", "우삼겹", "소갈비", "티본", "등심", "안심", "채끝", "beef"), "beef");
        addIfContains(lowered, attributes, List.of("양갈비", "양고기", "lamb"), "lamb");
        addIfContains(lowered, attributes, List.of("닭", "닭고기", "치킨", "닭갈비", "chicken"), "chicken");
        addIfContains(lowered, attributes, List.of("돼지", "돼지고기", "보쌈", "삼겹살", "목살", "족발", "pork"), "pork");
        addIfContains(lowered, attributes, List.of("연어", "새우", "조개", "굴", "문어", "날치알", "해산물", "생선", "seafood"), "seafood");
        addIfContains(lowered, attributes, List.of("파스타", "리조또", "크림", "알프레도", "로제"), "creamy");
        addIfContains(lowered, attributes, List.of("치즈", "브리", "고르곤졸라", "플래터"), "cheese");
        addIfContains(lowered, attributes, List.of("초콜릿", "케이크", "티라미수", "푸딩", "디저트", "dessert"), "dessert");
        addIfContains(lowered, attributes, List.of("달콤", "달달", "초콜릿", "디저트", "sweet"), "sweet");
        addIfContains(lowered, attributes, List.of("매운", "매콤", "김치", "닭갈비", "떡볶이", "마라", "짬뽕", "spicy"), "spicy");
        addIfContains(lowered, attributes, List.of("구이", "바비큐", "숯불", "직화", "스테이크"), "grilled");
        addIfContains(lowered, attributes, List.of("삼겹살", "보쌈", "우삼겹", "크림", "치즈", "스테이크", "갈비"), "fatty");
        addIfContains(lowered, attributes, List.of("초콜릿", "치즈", "크림", "리조또", "된장", "덮밥"), "rich");
        addIfContains(lowered, attributes, List.of("샐러드", "채소", "야채", "vegetable"), "vegetable");
        addIfContains(lowered, attributes, List.of("김치", "피클", "절임", "발효"), "fermented");
        addIfContains(lowered, attributes, List.of("김치", "샐러드", "날치알", "회", "상큼"), "refreshing");
        addIfContains(lowered, attributes, List.of("된장", "덮밥", "볶음", "구이", "육즙"), "savory");

        if (attributes.contains("beef") || attributes.contains("lamb")) {
            pairingHints.add("소고기");
            pairingHints.add("양고기");
        }
        if (attributes.contains("chicken")) {
            pairingHints.add("닭고기");
        }
        if (attributes.contains("pork")) {
            pairingHints.add("돼지고기");
        }
        if (attributes.contains("seafood")) {
            pairingHints.add("해산물");
        }
        if (attributes.contains("cheese")) {
            pairingHints.add("치즈");
        }
        if (attributes.contains("vegetable")) {
            pairingHints.add("채식/샐러드");
        }

        return FoodItem.builder()
                .label(label)
                .attributes(attributes)
                .pairingHints(pairingHints)
                .build();
    }

    private String normalizeLabel(String rawFoodText) {
        if (!StringUtils.hasText(rawFoodText)) {
            return "이 음식";
        }

        String normalized = rawFoodText.trim().replaceAll("\\s+", " ");

        for (String suffix : REQUEST_SUFFIXES) {
            if (normalized.endsWith(suffix)) {
                normalized = normalized.substring(0, normalized.length() - suffix.length()).trim();
                break;
            }
        }

        for (String particle : List.of("이랑", "랑", "과", "와")) {
            if (normalized.endsWith(particle)) {
                normalized = normalized.substring(0, normalized.length() - particle.length()).trim();
                break;
            }
        }

        normalized = normalized.replaceAll("[?.!,]+$", "").trim();
        return StringUtils.hasText(normalized) ? normalized : "이 음식";
    }

    private List<String> splitFoodLabels(String normalizedLabel) {
        if (!StringUtils.hasText(normalizedLabel)) {
            return List.of("이 음식");
        }

        String[] parts = MULTI_SEPARATOR.split(normalizedLabel);
        List<String> labels = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (StringUtils.hasText(trimmed)) {
                labels.add(trimmed);
            }
        }

        return labels.isEmpty() ? List.of(normalizedLabel) : labels;
    }

    private void addIfContains(String lowered, Set<String> attributes, List<String> keywords, String attribute) {
        if (keywords.stream().anyMatch(lowered::contains)) {
            attributes.add(attribute);
        }
    }
}
