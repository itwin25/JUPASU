package com.a505.jupasu.domain.wine.dto.response;

import com.a505.jupasu.domain.wine.entity.Wine;
import com.a505.jupasu.domain.wine.entity.WineType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WineSearchSimilarityResponse {
    private Long id;
    private String nameEn;
    private String winery;
    private WineType type;
    private String imageUrl;
    private Float sweetness;
    private Float acidity;
    private Float body;
    private Float tannin;

    public static WineSearchSimilarityResponse from(Wine wine) {
        return WineSearchSimilarityResponse.builder()
                .id(wine.getId())
                .nameEn(wine.getNameEn())
                .winery(wine.getOrigin() != null ? wine.getOrigin().getWinery() : null)
                .type(wine.getType())
                .imageUrl(wine.getImageUrl())
                .sweetness(wine.getTasteProfile() != null ? wine.getTasteProfile().getSweetness() : null)
                .acidity(wine.getTasteProfile() != null ? wine.getTasteProfile().getAcidity() : null)
                .body(wine.getTasteProfile() != null ? wine.getTasteProfile().getBody() : null)
                .tannin(wine.getTasteProfile() != null ? wine.getTasteProfile().getTannin() : null)
                .build();
    }
}
