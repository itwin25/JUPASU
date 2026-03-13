package com.a505.jupasu.domain.preference.entity;

import com.a505.jupasu.domain.user.entity.User;
import com.a505.jupasu.domain.wine.entity.WineType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 사용자의 와인 취향 및 선호 정보를 관리하는 엔티티
 * USER 테이블에서 분리되어 1:1 관계로 관리되며, 온보딩 미입력 상황을 고려하여 모든 필드는 Null 허용
 */
@Entity
@Getter
@Table(name = "preference")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Preference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // 선호 당도 (1~10 척도)
    private Integer sweetness;

    // 선호 산도/상큼함 (1~10 척도)
    private Integer acidity;

    // 선호 바디감 (1~10 척도)
    private Integer body;

    // 선호 탄닌 (1~10 척도)
    private Integer tannin;

    // 선호 도수 (1~10 척도)
    private Integer Abv;

    // 선호 가격대 최소 (단위: 원)
    private Integer preferredPriceMin;

    // 선호 가격대 최대 (단위: 원)
    private Integer preferredPriceMax;

    // AI가 생성한 유저 취향 요약 텍스트
    @Column(columnDefinition = "TEXT")
    private String preferSummary;

    // 선호 와인 종류 리스트 (다중 선택)
    @ElementCollection(targetClass = WineType.class)
    @CollectionTable(name = "pref_wine_types", joinColumns = @JoinColumn(name = "pref_id"))
    @Enumerated(EnumType.STRING)
    private List<WineType> preferredWineTypes = new ArrayList<>();

    // 선호 와인 맛/향 리스트 (다중 선택)
    @ElementCollection(targetClass = WineFlavor.class)
    @CollectionTable(name = "pref_wine_flavors", joinColumns = @JoinColumn(name = "pref_id"))
    @Enumerated(EnumType.STRING)
    private List<WineFlavor> preferredFlavors = new ArrayList<>();

    // 주요 음용 상황 리스트 (다중 선택)
    @ElementCollection(targetClass = DrinkingSituation.class)
    @CollectionTable(name = "pref_drinking_situations", joinColumns = @JoinColumn(name = "pref_id"))
    @Enumerated(EnumType.STRING)
    private List<DrinkingSituation> drinkingSituations = new ArrayList<>();

    /**
     * Preference 엔티티 생성을 위한 빌더
     * 모든 취향 정보는 선택 사항이므로 Null 허용
     */
    @Builder
    public Preference(User user, Integer sweetness, Integer acidity, Integer body, Integer tannin,
                      Integer Abv, Integer preferredPriceMin, Integer preferredPriceMax, String preferSummary,
                      List<WineType> wineTypes, List<WineFlavor> flavors, List<DrinkingSituation> situations) {
        this.user = user;
        this.sweetness = sweetness;
        this.acidity = acidity;
        this.body = body;
        this.tannin = tannin;
        this.Abv = Abv;
        this.preferredPriceMin = preferredPriceMin;
        this.preferredPriceMax = preferredPriceMax;
        this.preferSummary = preferSummary;
        this.preferredWineTypes = (wineTypes != null) ? wineTypes : new ArrayList<>();
        this.preferredFlavors = (flavors != null) ? flavors : new ArrayList<>();
        this.drinkingSituations = (situations != null) ? situations : new ArrayList<>();
    }

    /**
     * 사용자의 취향 정보를 일괄 업데이트
     * * @param sweetness          선호 당도
     * @param acidity            선호 산도
     * @param body               선호 바디감
     * @param tannin             선호 탄닌
     * @param Abv                선호 도수
     * @param preferredPriceMin  선호 가격대 최소
     * @param preferredPriceMax  선호 가격대 최대
     * @param preferSummary      유저 취향 요약 텍스트
     * @param wineTypes          선호 와인 종류 리스트
     * @param flavors            선호 맛/향 리스트
     * @param situations         주요 음용 상황 리스트
     */
    public void updatePreference(Integer sweetness, Integer acidity, Integer body, Integer tannin,
                                 Integer Abv, Integer preferredPriceMin, Integer preferredPriceMax, String preferSummary,
                                 List<WineType> wineTypes, List<WineFlavor> flavors, List<DrinkingSituation> situations) {
        if (sweetness != null) this.sweetness = sweetness;
        if (acidity != null) this.acidity = acidity;
        if (body != null) this.body = body;
        if (tannin != null) this.tannin = tannin;
        if (Abv != null) this.Abv = Abv;
        if (preferredPriceMin != null) this.preferredPriceMin = preferredPriceMin;
        if (preferredPriceMax != null) this.preferredPriceMax = preferredPriceMax;
        if (preferSummary != null) this.preferSummary = preferSummary;
        if (wineTypes != null) this.preferredWineTypes = wineTypes;
        if (flavors != null) this.preferredFlavors = flavors;
        if (situations != null) this.drinkingSituations = situations;
    }
}