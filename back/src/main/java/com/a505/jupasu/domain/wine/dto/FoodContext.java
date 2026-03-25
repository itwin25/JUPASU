package com.a505.jupasu.domain.wine.dto;

import java.util.List;
import java.util.Set;
import lombok.Builder;

@Builder
public record FoodContext(
        String originalText,
        String label,
        List<FoodItem> foods,
        Set<String> attributes,
        Set<String> pairingHints
) {
    public boolean hasAttribute(String attribute) {
        return attributes != null && attributes.contains(attribute);
    }

    public boolean hasAnyAttribute(String... candidates) {
        if (attributes == null || attributes.isEmpty()) {
            return false;
        }
        for (String candidate : candidates) {
            if (attributes.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    public boolean isMultiFood() {
        return foods != null && foods.size() > 1;
    }
}
