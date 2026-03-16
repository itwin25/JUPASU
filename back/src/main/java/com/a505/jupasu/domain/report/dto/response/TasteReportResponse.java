package com.a505.jupasu.domain.report.dto.response;

import com.a505.jupasu.domain.report.entity.TasteReport;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TasteReportResponse {
    private RadarData radarChart;
    private String mainTitle;
    private String tasteTypeTag;
    private String content;
    private String bestDescription;
    private String worstDescription;

    @Getter
    @Builder
    public static class RadarData {
        private Double sweetness;
        private Double acidity;
        private Double body;
        private Double tannin;
        private Double alcohol;
    }

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
                .tasteTypeTag("밸런스")
                .content(report.getContent())
                .bestDescription("피노 누아 계열을 더 탐색해 보세요!")
                .worstDescription("무거운 바디감의 와인은 피하는 게 좋아요.")
                .build();
    }

    private static double formatValue(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
