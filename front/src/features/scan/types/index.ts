export interface OCRBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRResult {
  text: string;
  score: number;
  box: OCRBox | number[][] | number[];
}

export interface OCRState {
  isLoading: boolean;
  error: string | null;
}
