export interface TasteData {
  sweetness: number; // 1-5
  acidity: number;
  tannin: number;
  body: number;
}

export interface OnboardingRequest {
  taste: TasteData;
  priceRange: [number, number];
  situations: string[];
}
