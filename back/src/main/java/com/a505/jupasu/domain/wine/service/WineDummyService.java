package com.a505.jupasu.domain.wine.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WineDummyService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 테스트용 100만건 데이터 insert
     * 검색 성능 밴치 마킹용
     */
    public void insertDummyData(){
        String sql = "INSERT INTO wine (" +
                "name_kr, name_en, type, country, region, winery, grape_variety, " +
                "sweetness, acidity, body, tannin, alcohol_degree, price, " +
                "average_rating, description, summary, image_url, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)";

        int totalCount = 1_000_000;
        int batchSize = 10_000; // 1만 건씩 묶어서 전송
        int loopCount = totalCount / batchSize;

        Random random = new Random();
        String[] types = {"RED", "WHITE", "ROSE", "DESSERT", "FORTIFIED"};
        String[] countries = {"France", "Italy", "USA", "Chile", "Spain", "Australia"};
        String[] regions = {"Bordeaux", "Tuscany", "Napa Valley", "Mendoza", "Rioja", "Barossa Valley"};
        String[] wineries = {"Chateau Margaux", "Antinori", "Opus One", "Concha y Toro", "Penfolds"};
        String[] varieties = {"Cabernet Sauvignon", "Merlot", "Chardonnay", "Shiraz", "Pinot Noir", "Sauvignon Blanc"};

        log.info("🚀 100만 건 와인 더미 데이터 INSERT 시작 (전체 컬럼 포함)...");
        long startTime = System.currentTimeMillis();

        for (int i = 0; i < loopCount; i++) {
            List<Object[]> batchArgs = new ArrayList<>();

            for (int j = 0; j < batchSize; j++) {
                int currentIndex = (i * batchSize) + j + 1;
                String randomString = UUID.randomUUID().toString().substring(0, 8);

                String type = types[random.nextInt(types.length)];
                String nameKr = "샤또 테스트 " + currentIndex + " " + randomString;
                String nameEn = "Chateau Test " + currentIndex + " " + randomString;
                String country = countries[random.nextInt(countries.length)];
                String region = regions[random.nextInt(regions.length)];
                String winery = wineries[random.nextInt(wineries.length)];
                String grapeVariety = varieties[random.nextInt(varieties.length)];

                // Float 지표들 (1.0 ~ 5.0)
                float sweetness = 1.0f + random.nextInt(5);
                float acidity = 1.0f + random.nextInt(5);
                float body = 1.0f + random.nextInt(5);
                float tannin = 1.0f + random.nextInt(5);

                // 알코올 도수 (9.0 ~ 15.0)
                float alcoholDegree = 9.0f + (random.nextFloat() * 6.0f);

                // 가격 (10,000 ~ 300,000원)
                int price = (random.nextInt(291) + 10) * 1000;

                // 평점 (1.0 ~ 5.0 소수점 1자리)
                double averageRating = Math.round((1.0 + (random.nextDouble() * 4.0)) * 10.0) / 10.0;

                String description = "이 와인은 " + country + "의 " + region + "에서 생산된 최고급 " + type + " 와인입니다. " +
                        grapeVariety + " 품종 특유의 깊은 풍미를 자랑합니다. (테스트용 데이터)";
                String summary = country + "산 가성비 좋은 " + type + " 데일리 와인";
                String imageUrl = "/images/dummy_wine_" + currentIndex + ".png";

                batchArgs.add(new Object[]{
                        nameKr, nameEn, type, country, region, winery, grapeVariety,
                        sweetness, acidity, body, tannin, alcoholDegree, price,
                        averageRating, description, summary, imageUrl
                });
            }

            // 1만 건씩 Bulk Insert 실행
            jdbcTemplate.batchUpdate(sql, batchArgs);
            log.info("✅ 데이터 삽입 진행률: {} / {} 완료", (i + 1) * batchSize, totalCount);
        }

        long endTime = System.currentTimeMillis();
        log.info("🎉 100만 건 INSERT 완료! 소요 시간: {}초", (endTime - startTime) / 1000.0);
    }

}
