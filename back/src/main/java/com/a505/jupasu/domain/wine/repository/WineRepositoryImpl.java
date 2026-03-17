package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

import static com.a505.jupasu.domain.wine.entity.QWine.wine;

@RequiredArgsConstructor
public class WineRepositoryImpl implements WineRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Wine> searchWines(WineSearchCondition condition, Pageable pageable) {

        BooleanBuilder builder = new BooleanBuilder();

        // 키워드 유사도 검색조건 추가
        builder.and(keywordSimilarity(condition.getKeyword()));

        // 필터링
        builder.and(typeEq(condition.getType()));
        builder.and(priceGoe(condition.getMinPrice()));
        builder.and(priceLoe(condition.getMaxPrice()));
        builder.and(ratingGoe(condition.getMinRate()));
        builder.and(countryEq(condition.getCountry()));

        OrderSpecifier<?> [] orderSpecifiers = getOrderSpecifier(pageable);

        // 조회 쿼리
        JPAQuery<Wine> query = queryFactory
                .selectFrom(wine)
                .where(builder)
                .offset(pageable.getOffset())
                .offset(pageable.getPageSize());

        // 동적 정렬
        if (StringUtils.hasText(condition.getKeyword())) {
            NumberExpression<Double> similarity = Expressions.numberTemplate(Double.class,
                    "function('word_similarity', {0}, {1})", condition.getKeyword(), wine.nameKr);

            // 유사도를 1순위로 정렬하고, 그 뒤에 페이징 정렬 조건들을 적용
            query.orderBy(similarity.desc());
            for (OrderSpecifier<?> orderSpecifier : orderSpecifiers) {
                query.orderBy(orderSpecifier);
            }
        } else {
            query.orderBy(orderSpecifiers);
        }

        List<Wine> content = query.fetch();

        // 5. 카운트 쿼리
        Long total = queryFactory
                .select(wine.count())
                .from(wine)
                .where(builder) // 본 쿼리와 동일한 builder 적용
                .fetchOne();

        long totalCount = total != null ? total : 0L;

        return new PageImpl<>(content, pageable, totalCount);

    }

    //=============================================================
    // 동적 필터링을 위한 쿼리 메소드 모음
    //=============================================================
    /**
     * 와인 이름에 키워드가 포함되어있는지 검사
     */
    private BooleanExpression keywordSimilarity(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        // PostgreSQL word_similarity 함수 호출
        NumberExpression<Double> similarity = Expressions.numberTemplate(Double.class,
                "function('word_similarity', {0}, {1})", keyword, wine.nameKr);

        // 유사도 점수 0.1 이상인 것만 필터링 (기존 <% 연산자와 동일한 역할)
        return similarity.gt(0.1);
    }

    /**
     * 와인 종류가 일치하는지 검사
     */
    private BooleanExpression typeEq(WineType type) {
        return type != null ? wine.type.eq(type) : null;
    }

    /**
     * 와인 가격 범위 검사
     */
    private BooleanExpression priceGoe(Integer minPrice) {
        return minPrice != null ? wine.price.goe(minPrice) : null;
    }

    private BooleanExpression priceLoe(Integer maxPrice) {
        return maxPrice != null ? wine.price.loe(maxPrice) : null;
    }

    /**
     * 와인 평균 평점 범위 검사
     */
    private BooleanExpression ratingGoe(Double minRate) {
        return minRate != null ? wine.averageRating.goe(minRate) : null;
    }

    /**
     * 와인 원산지 검사
     */
    private BooleanExpression countryEq (String country) {
        return StringUtils.hasText(country) ? wine.country.eq(country) : null;
    }

    //===================================================
    //정렬을 위한 메서드
    //===================================================

    /**
     * Spring Data JPA 의 Pageable객체 안에 있는 정렬 정보를
     * QueryDSL 이 사용할 수 있도록 OrderSpecifier 로 변환
     *
     * @param pageable 페이지 정렬 정보
     * @return
     */
    private OrderSpecifier<?>[] getOrderSpecifier(Pageable pageable) {
        List<OrderSpecifier<?>> orderSpecifiers = new ArrayList<>();

        if(pageable.getSort().isEmpty()){
            return new OrderSpecifier[]{new OrderSpecifier<>(Order.DESC, wine.id)};
        }
        for(Sort.Order order : pageable.getSort()) {
            Order direction = order.getDirection().isAscending() ? Order.ASC : Order.DESC;

            switch (order.getProperty()) {
                case "price":
                    orderSpecifiers.add(new OrderSpecifier<>(
                            direction,
                            wine.price,
                            OrderSpecifier.NullHandling.NullsLast
                    ));
                    break;
                case "rating":
                    orderSpecifiers.add(new OrderSpecifier<>(
                            direction,
                            wine.averageRating,
                            OrderSpecifier.NullHandling.NullsLast));
                    break;
                default:
                    orderSpecifiers.add(new OrderSpecifier<>(direction, wine.id));
                    break;
            }
        }
        return orderSpecifiers.toArray(new OrderSpecifier[0]);
    }
}
