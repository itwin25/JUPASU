export const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const cv = (window as any).cv;
  
  if (!cv || !cv.Mat) {
    console.warn('OpenCV.js가 준비되지 않아 원본으로 진행합니다.');
    return canvas;
  }

  try {
    // 1. Mat 객체 생성 (RGBA -> RGB)
    let src = cv.imread(canvas);
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2RGB);

    // [리사이징 로직 제거] 원본 해상도 그대로 사용하여 화질 보존

    // [Step 1] Grayscale 변환
    cv.cvtColor(dst, dst, cv.COLOR_RGB2GRAY);

    // [Step 2] Median Blur (3x3) - 노이즈 제거
    cv.medianBlur(dst, dst, 3);

    // [Step 3] CLAHE (적응형 대비 향상)
    const clahe = new cv.CLAHE(1.5, new cv.Size(8, 8));
    clahe.apply(dst, dst);
    clahe.delete();

    // [Step 4] Unsharp Mask (샤프닝)
    let blurred = new cv.Mat();
    cv.GaussianBlur(dst, blurred, new cv.Size(0, 0), 1.0, 1.0);
    cv.addWeighted(dst, 1.2, blurred, -0.2, 0, dst);
    blurred.delete();

    // [Step 5] 4채널(RGBA) 복구
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);

    // 2. 결과 출력
    const outCanvas = document.createElement('canvas');
    cv.imshow(outCanvas, dst);

    // 3. 자원 해제
    src.delete();
    dst.delete();

    return outCanvas;
  } catch (error) {
    console.error('OpenCV 전처리 중 에러:', error);
    return canvas;
  }
};
