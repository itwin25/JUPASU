package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.parsing.VivinoRawData;
import com.a505.jupasu.domain.wine.entity.*;
import com.a505.jupasu.domain.wine.entity.vo.Origin;
import com.a505.jupasu.domain.wine.entity.vo.RatingSummary;
import com.a505.jupasu.domain.wine.entity.vo.TasteProfile;
import com.a505.jupasu.domain.wine.entity.vo.WinePriceAndRating;
import com.a505.jupasu.domain.wine.repository.*;
import com.a505.jupasu.domain.wine.util.WineDataParser;
import org.springframework.cache.annotation.CacheEvict;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WineDataInitService {

    private final WineRepository wineRepository;
    private final FoodRepository foodRepository;
    private final WineFoodPairingRepository wineFoodPairingRepository;
    private final TasteGroupRepository tasteGroupRepository;
    private final WineTasteGroupRepository wineTasteGroupRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${SOURCE_IMAGE_DIR:/app/data/image}")
    private String sourceImageDir;

    @Value("${TARGET_IMAGE_DIR:/app/uploads/images/wines}")
    private String targetImageDir;

    @Value("${DATA_FILE_PATH:/app/data/vivino_ultra_results_kr_food_dedup.json}")
    private String dataFilePath;

    @CacheEvict(value = "wines", allEntries = true, cacheManager = "localCacheManager")
    @Transactional
    public void importWineDataFromJson() {
        log.info("🍷 [1/4] 데이터 초기화 시작 및 폴더 점검...");
        try {
            try {
                Path uploadPath = Paths.get(targetImageDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
            } catch (Exception folderEx) {
                log.warn("⚠️ 이미지 저장 디렉토리 생성 실패 (이미 있을 수 있음): {}", folderEx.getMessage());
            }

            File jsonFile = new File(dataFilePath);
            if (!jsonFile.exists()) {
                log.error("❌ JSON 파일을 찾을 수 없습니다: {}", dataFilePath);
                return;
            }

            List<VivinoRawData> rawDataList = objectMapper.readValue(jsonFile, new TypeReference<>() {});
            log.info("🍷 [2/4] 외부 JSON 파일에서 {} 건의 데이터를 읽었습니다.", rawDataList.size());

            Map<String, Food> foodCache = new HashMap<>();
            Map<String, TasteGroup> tasteGroupCache = new HashMap<>();
            int batchSize = 1000;
            List<Wine> wineBatch = new ArrayList<>();
            List<VivinoRawData> rawBatch = new ArrayList<>();

            log.info("🍷 [3/4] 와인 엔티티 변환 및 연관관계 저장 진행 중...");
            for (int i = 0; i < rawDataList.size(); i++) {
                VivinoRawData raw = rawDataList.get(i);

                Map<String, String> allFacts = raw.allFacts() != null ? raw.allFacts() : Map.of();
                Map<String, String> taste = raw.tasteProfile() != null ? raw.tasteProfile() : Map.of();

                Object[] priceInfo = WineDataParser.parsePrice(raw.price());
                Object[] alcInfo = WineDataParser.parseAlcohol(allFacts.get("Alcohol content"));
                Map<String, Object> ratings = parseRatingsMap(raw);
                double externalAverageRating = parseDouble(ratings.get("average"));
                int externalRatingCount = parseInt(ratings.get("count"));

                Map<String, Object> distribution =
                        ratings.get("distribution") instanceof Map<?, ?> dist
                                ? (Map<String, Object>) dist
                                : Map.of();

                int star1 = parseInt(distribution.get("1"));
                int star2 = parseInt(distribution.get("2"));
                int star3 = parseInt(distribution.get("3"));
                int star4 = parseInt(distribution.get("4"));
                int star5 = parseInt(distribution.get("5"));

                Object[] sweetnessInfo = WineDataParser.parseTaste(taste.get("sweetness"));
                Object[] acidityInfo = WineDataParser.parseTaste(taste.get("acidity"));
                Object[] bodyInfo = WineDataParser.parseTaste(taste.get("boldness"));
                Object[] tanninInfo = WineDataParser.parseTaste(taste.get("tannic"));

                String grapes = allFacts.getOrDefault("Grapes", "");
                String winery = StringUtils.hasText(raw.winery()) ? raw.winery() : allFacts.getOrDefault("Winery", "");
                String region = StringUtils.hasText(raw.region()) ? raw.region() : allFacts.getOrDefault("Region", "");
                String style = allFacts.getOrDefault("Wine style", "");

                String finalImageUrl = processImageFile(raw.localImagePaths());

                Wine wine = Wine.builder()
                        .nameKr(raw.nameKr())
                        .isRealNameKr(StringUtils.hasText(raw.nameKr()))
                        .nameEn(raw.wineName())
                        .isRealNameEn(StringUtils.hasText(raw.wineName()))
                        .type(WineDataParser.parseType(raw.wineType()))
                        .grapeVariety(grapes)
                        .style(style)
                        .description(raw.description())
                        .imageUrl(finalImageUrl)
                        .alcoholDegree((Float) alcInfo[0])
                        .isRealAlcoholDegree((Boolean) alcInfo[1])
                        .origin(Origin.builder()
                                .country(raw.country())
                                .isRealCountry(StringUtils.hasText(raw.country()))
                                .region(region)
                                .isRealRegion(StringUtils.hasText(region))
                                .winery(winery)
                                .isRealWinery(StringUtils.hasText(winery))
                                .build())
                        .priceAndRating(WinePriceAndRating.builder()
                                .price((Integer) priceInfo[0])
                                .isRealPrice((Boolean) priceInfo[1])
                                .averageRating(externalAverageRating) // 초기값
                                .isRealRating(externalRatingCount > 0)
                                .build())
                        .ratingSummary(RatingSummary.builder().build())
                        .tasteProfile(TasteProfile.builder()
                                .sweetness((Float) sweetnessInfo[0])
                                .isRealSweetness((Boolean) sweetnessInfo[1])
                                .acidity((Float) acidityInfo[0])
                                .isRealAcidity((Boolean) acidityInfo[1])
                                .body((Float) bodyInfo[0])
                                .isRealBody((Boolean) bodyInfo[1])
                                .tannin((Float) tanninInfo[0])
                                .isRealTannin((Boolean) tanninInfo[1])
                                .build())
                        .richDescription(raw.richDescription())
                        .embedding(parseVector(raw.embedding()))
                        .embeddingModel(raw.embeddingModel())
                        .embeddingGeneratedAt(parseOffsetDateTime(raw.embeddingGeneratedAt()))
                        .build();

                wine.initializeExternalRatings(
                        externalAverageRating,
                        externalRatingCount,
                        star1, star2, star3, star4, star5
                );
                wineBatch.add(wine);
                rawBatch.add(raw);

                // 1000건 단위 Batch Insert
                if (wineBatch.size() == batchSize || i == rawDataList.size() - 1) {

                    // ⭐️ [핵심 1] saveAll의 리턴값을 다시 받아와서 확실하게 ID가 생성된 와인 리스트를 사용합니다!
                    List<Wine> savedWines = wineRepository.saveAll(wineBatch);

                    List<WineFoodPairing> pairingBatch = new ArrayList<>();

                    List<WineTasteGroup> tasteGroupBatch = new ArrayList<>();

                    // ⭐️ [핵심 2] 연관관계 매핑 (ID가 있는 savedWines 사용)
                    for (int j = 0; j < savedWines.size(); j++) {
                        Wine savedWine = savedWines.get(j);
                        VivinoRawData correspondingRaw = rawBatch.get(j);

                        // JSON에 food_pairings 데이터가 존재한다면
                        if (correspondingRaw.foodPairings() != null && !correspondingRaw.foodPairings().isEmpty()) {
                            for (String foodName : correspondingRaw.foodPairings()) {
                                if (!StringUtils.hasText(foodName)) continue;

                                // 음식 찾기 or 새로 만들기
                                Food food = foodCache.computeIfAbsent(foodName, key ->
                                        foodRepository.findByName(key).orElseGet(() -> foodRepository.save(Food.builder().name(key).build()))
                                );

                                // 페어링 엔티티 조립
                                pairingBatch.add(WineFoodPairing.builder()
                                        .wine(savedWine)
                                        .food(food)
                                        .build());
                            }
                        }

                        if (correspondingRaw.top3TasteGroupsKr() != null && !correspondingRaw.top3TasteGroupsKr().isEmpty()) {
                            for (String tasteName : correspondingRaw.top3TasteGroupsKr()) {
                                if (!StringUtils.hasText(tasteName)) continue;

                                // 향 찾기 or 새로 만들기
                                TasteGroup tasteGroup = tasteGroupCache.computeIfAbsent(tasteName, key ->
                                        tasteGroupRepository.findByName(key).orElseGet(() -> tasteGroupRepository.save(TasteGroup.builder().name(key).build()))
                                );

                                // 페어링 엔티티 조립
                                tasteGroupBatch.add(WineTasteGroup.builder()
                                        .wine(savedWine)
                                        .tasteGroup(tasteGroup)
                                        .build());
                            }
                        }
                    }

                    // ⭐️ [핵심 3] 조립된 페어링 정보들을 최종적으로 DB에 저장합니다.
                    wineFoodPairingRepository.saveAll(pairingBatch);
                    wineTasteGroupRepository.saveAll(tasteGroupBatch);

                    log.info("👉 {}/{} 건 와인 및 음식 페어링 저장 완료...", i + 1, rawDataList.size());
                    wineBatch.clear();
                    rawBatch.clear();
                }
            }

            log.info("🎉 [4/4] 와인, 음식, 연관관계 데이터 및 이미지 세팅이 성공적으로 끝났습니다!");

        } catch (Exception e) {
            log.error("❌ 와인 데이터 초기화 중 에러 발생: {}", e.getMessage(), e);
        }
    }

    private String processImageFile(Map<String, String> localImagePaths) {
        String defaultImageUrl = "/default_wine.png";
        if (localImagePaths == null || !localImagePaths.containsKey("bottle")) {
            return defaultImageUrl;
        }

        String rawPathStr = localImagePaths.get("bottle");
        if (!StringUtils.hasText(rawPathStr)) return defaultImageUrl;

        try {
            String fileNameOnly = rawPathStr;
            if (fileNameOnly.contains("\\")) fileNameOnly = fileNameOnly.substring(fileNameOnly.lastIndexOf("\\") + 1);
            if (fileNameOnly.contains("/")) fileNameOnly = fileNameOnly.substring(fileNameOnly.lastIndexOf("/") + 1);

            Path sourcePath = Paths.get(sourceImageDir, fileNameOnly);
            if (!Files.exists(sourcePath)) return defaultImageUrl;

            String extension = fileNameOnly.lastIndexOf(".") > 0 ? fileNameOnly.substring(fileNameOnly.lastIndexOf(".")) : "";
            String newFileName = UUID.randomUUID().toString() + extension;
            Path targetPath = Paths.get(targetImageDir, newFileName);

            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/images/wines/" + newFileName;

        } catch (Exception e) {
            log.error("이미지 복사 실패: {}", e.getMessage());
            return defaultImageUrl;
        }
    }

    private int parseInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private double parseDouble(Object value) {
        if (value == null) return 0.0;
        if (value instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(value.toString().trim());
        } catch (Exception e) {
            return 0.0;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseRatingsMap(VivinoRawData raw) {
        if (raw.ratings() == null) return Map.of();
        return (Map<String, Object>) raw.ratings();
    }

    private OffsetDateTime parseOffsetDateTime(String value) {
        if (!StringUtils.hasText(value)) return null;
        try {
            return OffsetDateTime.parse(value);
        } catch (Exception e) {
            log.warn("⚠️ 날짜 파싱 실패: {}", value);
            return null;
        }
    }

    private float[] parseVector(List<Double> values) {
        if (values == null || values.isEmpty()) return null;
        try {
            float[] vector = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                vector[i] = values.get(i).floatValue();
            }
            return vector;
        } catch (Exception e) {
            log.warn("⚠️ 벡터 변환 실패: {}", e.getMessage());
            return null;
        }
    }
}
