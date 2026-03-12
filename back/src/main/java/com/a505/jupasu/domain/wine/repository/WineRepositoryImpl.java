package com.a505.jupasu.domain.wine.repository;

import com.a505.jupasu.domain.wine.dto.WineSearchCondition;
import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

import static com.a505.jupasu.domain.wine.entity.QWine.wine;

@RequiredArgsConstructor
public class WineRepositoryImpl implements WineRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Wine> searchWines(WineSearchCondition condition, Pageable pageable) {

        List<Wine> content = queryFactory
                .selectFrom(wine)
                .where(
                        keywordContains(condition.getKeyword()),
                        typeEq(condition.getType()),
                        priceBetween(condition.getMinPrice(), condition.getMaxPrice()),
                        ratingGoe(condition.getMinRate()),
                        countryEq(condition.getCountry())
                        )
                .orderBy(getOrderSpecifier(pageable))
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        JPAQuery<Long> countQuery = queryFactory
                .select(wine.count())
                .from(wine)
                .where(
                        keywordContains(condition.getKeyword()),
                        typeEq(condition.getType()),
                        priceBetween(condition.getMinPrice(), condition.getMaxPrice()),
                        ratingGoe(condition.getMinRate()),
                        countryEq(condition.getCountry())
                );
        return PageableExecutionUtils.getPage(content, pageable, countQuery::fetchOne);
    }

    //=============================================================
    // 동적 필터링을 위한 쿼리 메소드 모음
    //=============================================================
    /**
     * 와인 이름에 키워드가 포함되어있는지 검사
     */
    private BooleanExpression keywordContains(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return wine.nameKr.containsIgnoreCase(keyword)
                .or(wine.nameEn.containsIgnoreCase(keyword));
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
    private BooleanExpression priceBetween(Integer minPrice, Integer maxPrice) {
        if(minPrice !=  null && maxPrice != null) {
            return wine.price.between(minPrice, maxPrice);
        } else if(minPrice != null) {
            return wine.price.goe(minPrice);
        } else if(maxPrice != null) {
            return wine.price.loe(maxPrice);
        }
        return null;
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
