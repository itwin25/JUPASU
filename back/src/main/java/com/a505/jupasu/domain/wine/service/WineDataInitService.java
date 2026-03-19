package com.a505.jupasu.domain.wine.service;

import com.a505.jupasu.domain.wine.dto.parsing.VivinoRawData;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.vo.Origin;
import com.a505.jupasu.domain.wine.entity.vo.TasteProfile;
import com.a505.jupasu.domain.wine.entity.vo.WinePriceAndRating;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import com.a505.jupasu.domain.wine.util.WineDataParser;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WineDataInitService {

    private final WineRepository wineRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ⭐️ 로컬 PC에서 원본 이미지를 가져올 폴더
    private final String SOURCE_IMAGE_DIR = "C:/image";
    // 프로젝트 내에 복사될 폴더
    private final String TARGET_IMAGE_DIR = "uploads/images/wines";

    @Transactional
    public void importWineDataFromJson() {
        try {
            Path uploadPath = Paths.get(TARGET_IMAGE_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            InputStream inputStream = getClass().getResourceAsStream("/vivino_ultra_results_with_kr.json");
            if (inputStream == null) {
                log.error("JSON 파일을 찾을 수 없습니다.");
                return;
            }

            List<VivinoRawData> rawDataList = objectMapper.readValue(inputStream, new TypeReference<>() {});
            List<Wine> wineList = new ArrayList<>();

            for (VivinoRawData raw : rawDataList) {
                Object[] priceInfo = WineDataParser.parsePrice(raw.price());
                Object[] alcInfo = WineDataParser.parseAlcohol(raw.alcohol());
                Double averageRating = (raw.ratings() != null && raw.ratings().get("average") != null)
                        ? raw.ratings().get("average") : 0.0;

                Map<String, String> taste = raw.tasteProfile() != null ? raw.tasteProfile() : Map.of();
                Object[] sweetnessInfo = WineDataParser.parseTaste(taste.get("sweetness"));
                Object[] acidityInfo = WineDataParser.parseTaste(taste.get("acidity"));
                Object[] bodyInfo = WineDataParser.parseTaste(taste.get("boldness"));
                Object[] tanninInfo = WineDataParser.parseTaste(taste.get("tannin"));

                // 이미지 복사 로직 실행!
                String finalImageUrl = processImageFile(raw.localImagePath());

                Wine wine = Wine.builder()
                        .nameKr(raw.nameKr())
                        .isRealNameKr(StringUtils.hasText(raw.nameKr()))
                        .nameEn(raw.wineName())
                        .isRealNameEn(StringUtils.hasText(raw.wineName()))
                        .type(WineDataParser.parseType(raw.type()))
                        .grapeVariety(raw.grapes())
                        .description(raw.description())
                        .imageUrl(finalImageUrl) // ⭐️ UUID로 변환된 최종 URL 저장
                        .alcoholDegree((Float) alcInfo[0])
                        .isRealAlcoholDegree((Boolean) alcInfo[1])
                        .origin(Origin.builder().country(raw.country()).isRealCountry(StringUtils.hasText(raw.country())).region(raw.region()).isRealRegion(StringUtils.hasText(raw.region())).winery(raw.winery()).isRealWinery(StringUtils.hasText(raw.winery())).build())
                        .priceAndRating(WinePriceAndRating.builder().price((Integer) priceInfo[0]).isRealPrice((Boolean) priceInfo[1]).averageRating(averageRating).isRealRating(averageRating > 0.0).build())
                        .tasteProfile(TasteProfile.builder().sweetness((Float) sweetnessInfo[0]).isRealSweetness((Boolean) sweetnessInfo[1]).acidity((Float) acidityInfo[0]).isRealAcidity((Boolean) acidityInfo[1]).body((Float) bodyInfo[0]).isRealBody((Boolean) bodyInfo[1]).tannin((Float) tanninInfo[0]).isRealTannin((Boolean) tanninInfo[1]).build())
                        .build();

                wineList.add(wine);
            }

            wineRepository.saveAll(wineList);
            log.info("🍷 총 {}개의 와인 데이터 및 이미지 세팅 완료!", wineList.size());

        } catch (Exception e) {
            log.error("와인 데이터 초기화 중 에러 발생: {}", e.getMessage(), e);
        }
    }

    /**
     * 이미지 복사 헬퍼 메서드 (OS 호환성 강화 ⭐️)
     */
    private String processImageFile(Map<String, String> localImagePath) {
        String defaultImageUrl = "/images/default_wine.png";

        if (localImagePath == null || !localImagePath.containsKey("bottle")) {
            return defaultImageUrl;
        }

        // 예: "C:\\datasets\\wine\\wine_bottle_2159.png"
        String rawPathStr = localImagePath.get("bottle");
        if (!StringUtils.hasText(rawPathStr)) {
            return defaultImageUrl;
        }

        try {
            // ⭐️ 윈도우나 리눅스 환경에 상관없이 파일명(wine_bottle_2159.png)만 강제로 추출합니다.
            String fileNameOnly = rawPathStr;
            if (fileNameOnly.contains("\\")) {
                fileNameOnly = fileNameOnly.substring(fileNameOnly.lastIndexOf("\\") + 1);
            }
            if (fileNameOnly.contains("/")) {
                fileNameOnly = fileNameOnly.substring(fileNameOnly.lastIndexOf("/") + 1);
            }

            // 개발자님의 C:/image 폴더와 추출한 파일명을 합쳐서 진짜 파일 위치를 만듭니다.
            Path sourcePath = Paths.get(SOURCE_IMAGE_DIR, fileNameOnly);

            if (!Files.exists(sourcePath)) {
                log.warn("이미지 없음 (기본 이미지 대체): {}", sourcePath.toString());
                return defaultImageUrl;
            }

            // 확장자 추출 및 UUID 적용
            String extension = "";
            int extIndex = fileNameOnly.lastIndexOf(".");
            if (extIndex > 0) {
                extension = fileNameOnly.substring(extIndex);
            }
            String newFileName = UUID.randomUUID().toString() + extension;
            Path targetPath = Paths.get(TARGET_IMAGE_DIR, newFileName);

            // 파일 복사
            Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/images/wines/" + newFileName;

        } catch (Exception e) {
            log.error("이미지 복사 실패 ({}): {}", rawPathStr, e.getMessage());
            return defaultImageUrl;
        }
    }
}