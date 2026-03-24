package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.entity.Wine;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class WineSearchRepositoryCustomImpl implements WineSearchRepositoryCustom {

    @PersistenceContext
    private final EntityManager em;

    @Override
    @SuppressWarnings("unchecked")
    public List<Wine> searchBySimilarity(String keyword, Double threshold) {
        // 검색어 전처리 (트리밍 및 소문자화 고려)
        String sql = "SELECT w.* FROM wine w " +
                     "ORDER BY (similarity(w.name_en, :keyword) * 2 + similarity(w.winery, :keyword)) DESC " +
                     "LIMIT 5";

        Query query = em.createNativeQuery(sql, Wine.class);
        query.setParameter("keyword", keyword);

        return query.getResultList();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Wine> findSimilarTastes(Wine target, int limit) {
        String sql = "SELECT * FROM (" +
                     "  SELECT DISTINCT ON (w.winery) w.*, " +
                     "  (abs(w.sweetness - :s) + abs(w.acidity - :a) + abs(w.body - :b) + abs(w.tannin - :t)) as diff " +
                     "  FROM wine w " +
                     "  WHERE w.type = :type " +
                     "  AND w.id != :id " +
                     "  AND w.winery != :winery " +
                     "  ORDER BY w.winery, diff ASC" +
                     ") sub " +
                     "ORDER BY diff ASC " +
                     "LIMIT :limit";

        Query query = em.createNativeQuery(sql, Wine.class);
        query.setParameter("type", target.getType().name());
        query.setParameter("id", target.getId());
        query.setParameter("winery", target.getOrigin().getWinery());
        query.setParameter("s", target.getTasteProfile().getSweetness());
        query.setParameter("a", target.getTasteProfile().getAcidity());
        query.setParameter("b", target.getTasteProfile().getBody());
        query.setParameter("t", target.getTasteProfile().getTannin());
        query.setParameter("limit", limit);

        return query.getResultList();
    }
}
