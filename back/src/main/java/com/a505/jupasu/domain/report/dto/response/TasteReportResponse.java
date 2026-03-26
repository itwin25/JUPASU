package com.a505.jupasu.domain.report.dto.response;

import com.a505.jupasu.domain.report.entity.TasteReport;
import lombok.Builder;
import lombok.Getter;

/**
 * 취향 리포트 조회 시 프론트엔드에 전달되는 응답 데이터 객체
 */
@Getter
@Builder
public class TasteReportResponse {
    private RadarData radarChart;
    private String mainTitle;
    private String tasteTypeTag;
    private String content;
    private String bestDescription;
    private String worstDescription;

    /**
     * 레이더 차트를 구성하는 5가지 맛 요소 데이터
     */
    @Getter
    @Builder
    public static class RadarData {
        private Double sweetness;
        private Double acidity;
        private Double body;
        private Double tannin;
        private Double alcohol;
    }

    /**
     * TasteReport 엔티티를 TasteReportResponse DTO로 변환
     * 텍스트 영역은 현재 AI 연동 전 임시 템플릿을 제공
     */
    public static TasteReportResponse from(TasteReport report) {
        return TasteReportResponse.builder()
                .radarChart(RadarData.builder()
                        .sweetness(formatValue(report.getAvgSweetness()))
                        .acidity(formatValue(report.getAvgAcidity()))
                        .body(formatValue(report.getAvgBody()))
                        .tannin(formatValue(report.getAvgTannin()))
                        .alcohol(formatValue(report.getAvgAlcohol()))
                        .build())
                .mainTitle(report.getMainTitle())
                .tasteTypeTag(report.getTasteTypeTag())
                .content(report.getContent())
                .bestDescription(report.getBestDescription())
                .worstDescription(report.getWorstDescription())
                .build();
    }

    /**
     * 차트 수치의 가독성을 위해 소수점 첫째 자리까지 반올림
     */
    private static double formatValue(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
