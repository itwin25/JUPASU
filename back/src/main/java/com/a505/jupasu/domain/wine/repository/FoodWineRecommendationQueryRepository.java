package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.dto.FoodWineSearchCandidate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class FoodWineRecommendationQueryRepository {

    private final EntityManager entityManager;

    public List<FoodWineSearchCandidate> findTopCandidatesByQueryVector(String queryVector, int limit) {
        Query query = entityManager.createNativeQuery("""
                SELECT
                    w.id AS wine_id,
                    w.name_kr,
                    w.name_en,
                    w.type AS wine_type,
                    w.country,
                    w.region,
                    w.price,
                    w.image_url,
                    w.body,
                    w.acidity,
                    w.tannin,
                    w.sweetness,
                    w.rich_description,
                    COALESCE(string_agg(DISTINCT f.name, ','), '') AS food_pairings,
                    1 - (w.embedding <=> CAST(:queryVector AS vector)) AS food_similarity
                FROM wine w
                LEFT JOIN wine_food_pairing wfp ON wfp.wine_id = w.id
                LEFT JOIN food f ON f.id = wfp.food_id
                WHERE w.embedding IS NOT NULL
                GROUP BY
                    w.id, w.name_kr, w.name_en, w.type, w.country, w.region,
                    w.price, w.image_url, w.body, w.acidity, w.tannin, w.sweetness,
                    w.rich_description, w.embedding
                ORDER BY w.embedding <=> CAST(:queryVector AS vector)
                LIMIT :limit
                """);

        query.setParameter("queryVector", queryVector);
        query.setParameter("limit", limit);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        return rows.stream()
                .map(this::toCandidate)
                .toList();
    }

    private FoodWineSearchCandidate toCandidate(Object[] row) {
        String foodPairingsText = row[13] == null ? "" : row[13].toString();

        return FoodWineSearchCandidate.builder()
                .wineId(asLong(row[0]))
                .nameKr(asString(row[1]))
                .nameEn(asString(row[2]))
                .wineType(asString(row[3]))
                .country(asNullableString(row[4]))
                .region(asNullableString(row[5]))
                .price(asInteger(row[6]))
                .imageUrl(asNullableString(row[7]))
                .body(asDouble(row[8]))
                .acidity(asDouble(row[9]))
                .tannin(asDouble(row[10]))
                .sweetness(asDouble(row[11]))
                .richDescription(asNullableString(row[12]))
                .foodPairings(parseFoodPairings(foodPairingsText))
                .foodSimilarity(asDouble(row[14]))
                .build();
    }

    private List<String> parseFoodPairings(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .toList();
    }

    private Long asLong(Object value) {
        return value == null ? null : ((Number) value).longValue();
    }

    private Integer asInteger(Object value) {
        return value == null ? null : ((Number) value).intValue();
    }

    private Double asDouble(Object value) {
        return value == null ? null : ((Number) value).doubleValue();
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    private String asNullableString(Object value) {
        return value == null ? null : value.toString();
    }
}
