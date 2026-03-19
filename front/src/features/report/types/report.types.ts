export interface TasteReportRadar {
  sweetness: number;
  acidity: number;
  body: number;
  tannin: number;
  alcohol: number;
}

export interface TasteReportResponse {
  radarChart: TasteReportRadar;
  mainTitle: string;
  tasteTypeTag: string;
  content: string;
  bestDescription: string;
  worstDescription: string;
}
