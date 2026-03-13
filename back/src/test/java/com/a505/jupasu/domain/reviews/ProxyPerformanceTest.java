package com.a505.jupasu.domain.reviews;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.user.repository.UserRepository;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StopWatch;

@SpringBootTest(properties = {
        "JWT_SECRET=VGhpc0lzQUR1bW15U2VjcmV0S2V5Rm9yVGVzdGluZ1B1cnBvc2VzMTIzNDU2Nzg5MA=="
})
@Transactional // 테스트가 끝나면 DB에 넣었던 데이터를 깔끔하게 롤백(삭제)해 줍니다.
@ActiveProfiles("local")
public class ProxyPerformanceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WineRepository wineRepository;

    @Autowired
    private EntityManager entityManager; // 1차 캐시를 비우기 위해 필요합니다.

    @Test
    @DisplayName("리뷰 작성 시 findById와 getReferenceById(프록시)의 조회 성능 1000번 비교")

    void compareProxyPerformance() {
        User dummyUser = User.builder()
                .email("test" + System.currentTimeMillis() + "@example.com") // Unique 제약조건 방지
                .passwordHash("password1234")
                .nickname("테스트유저" + System.currentTimeMillis())             // Unique 제약조건 방지
                .character("WINE_BEGINNER")
                .build();
        userRepository.save(dummyUser);

        // 🍷 Wine.java 엔티티의 필수값(NOT NULL)에 맞춘 더미 와인
        Wine dummyWine = Wine.builder()
                .nameKr("테스트 레드 와인")
                .type(WineType.RED) // Enum 타입 필수값
                // sweetness, acidity 등은 @Builder.Default로 0.0f가 자동 적용됩니다!
                .build();
        wineRepository.save(dummyWine);

        // 영속성 컨텍스트를 DB에 반영하고 메모리를 비웁니다. (초기화)
        entityManager.flush();
        entityManager.clear();

        Long userId = dummyUser.getId();
        Long wineId = dummyWine.getId();
        int cnt = 0;
        // 스프링이 제공하는 초정밀 시간 측정 도구입니다.
        StopWatch stopWatch = new StopWatch("리뷰 작성 엔티티 조회 성능 비교 (1000회)");

        // =========================================================================
        // 1. 기존 방식 (findById): 매번 실제 DB에서 SELECT 쿼리를 날려 엔티티를 가져옵니다.
        // =========================================================================
        stopWatch.start("1. findById (실제 DB I/O 발생)");
        for (int i = 0; i < 1000; i++) {
            User user = userRepository.findById(userId).orElseThrow();
            Wine wine = wineRepository.findById(wineId).orElseThrow();

            // 실제 API 요청이 1000번 들어온 것과 똑같은 환경을 만들기 위해 1차 캐시를 비웁니다.
            entityManager.clear();
        }
        stopWatch.stop();

        // =========================================================================
        // 2. 최적화 방식 (getReferenceById): DB에 가지 않고 빈 껍데기(프록시)만 만듭니다.
        // =========================================================================
        stopWatch.start("2. getReferenceById (프록시 객체 생성)");
        for (int i = 0; i < 1000; i++) {
            User proxyUser = userRepository.getReferenceById(userId);
            Wine proxyWine = wineRepository.getReferenceById(wineId);

            // 프록시 객체는 캐시와 무관하게 메모리에서 즉시 생성되지만, 동일한 조건을 위해 비워줍니다.
            entityManager.clear();
        }
        stopWatch.stop();

        // then: 콘솔에 예쁜 표 형태로 결과를 출력합니다.
        System.out.println("=====================================================");
        System.out.println(stopWatch.prettyPrint());
        System.out.println("=====================================================");
    }
}
