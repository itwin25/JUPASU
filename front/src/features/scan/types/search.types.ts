/**
 * 와인 검색 결과 타입 정의
 */
export interface WineSearchSimilarityResponse {
  id: number;
  nameEn: string;
  winery: string;
  type: string;
  imageUrl: string;
  sweetness: number;
  acidity: number;
  body: number;
  tannin: number;
}

/**
 * 하이브리드 검색 응답 타입 정의
 */
export interface HybridSearchResponse {
  bestMatch: WineSearchSimilarityResponse | null;
  recommendations: WineSearchSimilarityResponse[];
}
