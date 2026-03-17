package com.a505.jupasu.domain.wine.util;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.wine.dto.WineRecommendationItem;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.repository.WineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;
import java.util.PriorityQueue;

@Component
@RequiredArgsConstructor
public class WineRecommendationCalculator {

    private final WineRepository wineRepository;

    /**
     * 상황 기반 퀵 추천 목록 반환
     */
    public List<WineRecommendationItem> quickList(User user, Long situationId) {
        // 최소 힙: 힙의 최솟값이 루트에 위치하므로 상위 5개 유지에 적합
        PriorityQueue<WineScore> minHeap = new PriorityQueue<>(Comparator.comparingInt(WineScore::match));
        List<Wine> wineList = wineRepository.findAll();

        for (Wine wine : wineList) {
            int match = getMatch(user, wine, situationId);
            if (minHeap.size() < 5) {
                minHeap.offer(new WineScore(match, wine));
            } else if (match > minHeap.peek().match()) {
                minHeap.poll();
                minHeap.offer(new WineScore(match, wine));
            }
        }

        return minHeap.stream()
                .sorted(Comparator.comparingInt(WineScore::match).reversed())
                .map(score -> WineRecommendationItem.of(score.wine(), score.match()))
                .toList();
    }

    /**
     * 상황을 고려한 추천도 계산
     */
    public int getMatch(User user, Wine wine, Long situationId) {
        // TODO: 추천도 계산 로직 구현 예정
        return 0;
    }

    /**
     * 상황 없이 사용자 취향 기반 추천도 계산
     */
    public int getMatch(User user, Wine wine) {
        // TODO: 추천도 계산 로직 구현 예정
        return 0;
    }

    // 계산 중간 결과를 담는 내부 데이터 홀더
    record WineScore(int match, Wine wine) {}
}
