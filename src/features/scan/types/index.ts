export interface OCRResult {
  text: string;
  score: number;
  box: number[][];
}

export interface OCRState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}
