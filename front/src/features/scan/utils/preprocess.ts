/**
 * OCR 인식을 위한 이미지 전처리 유틸리티
 * (현재 이미지 선명화 및 필터 로직을 건너뛰고 원본 또는 최소 변환만 수행)
 */
export const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  // 🚀 이미지 선명화 및 필터 로직 건너뜀 (사용자 요청)
  // 필요한 경우 여기에 리사이징 로직만 추가할 수 있습니다.
  console.log('⏩ 이미지 전처리(선명화 등) 건너뜀');
  return canvas;
};
