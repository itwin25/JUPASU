export const preprocessImage = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const cv = (window as any).cv;

  if (!cv || !cv.Mat) {
    console.warn('OpenCV.js가 준비되지 않아 원본으로 진행합니다.');
    return canvas;
  }

  try {
    let src = cv.imread(canvas);
    
    // 🚀 [Square Padding] 이미지 비율 보존을 위해 정사각형으로 만듦
    const maxSide = Math.max(src.rows, src.cols);
    let dst = new cv.Mat.zeros(maxSide, maxSide, cv.CV_8UC4); // 검은색 배경
    
    // 중앙 배치를 위한 오프셋 계산
    const xOffset = Math.floor((maxSide - src.cols) / 2);
    const yOffset = Math.floor((maxSide - src.rows) / 2);
    
    // 원본 이미지를 중앙에 복사
    let rect = new cv.Rect(xOffset, yOffset, src.cols, src.rows);
    src.copyTo(dst.roi(rect));
    
    // [Step 1] RGB 변환 및 그레이스케일
    let gray = new cv.Mat();
    cv.cvtColor(dst, gray, cv.COLOR_RGBA2GRAY);

    // [Step 2] 에지 보존 노이즈 제거 (Bilateral Filter)
    let intermediate = new cv.Mat();
    cv.bilateralFilter(gray, intermediate, 5, 75, 75);

    // [Step 3] CLAHE (적응형 대비 향상)
    const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
    clahe.apply(intermediate, intermediate);

    // [Step 4] Unsharp Mask (선명도 보정)
    let blurred = new cv.Mat();
    cv.GaussianBlur(intermediate, blurred, new cv.Size(0, 0), 3);
    cv.addWeighted(intermediate, 1.5, blurred, -0.5, 0, intermediate);

    // [Step 5] 최종 출력용 RGBA 복구
    let final = new cv.Mat();
    cv.cvtColor(intermediate, final, cv.COLOR_GRAY2RGBA);

    const outCanvas = document.createElement('canvas');
    cv.imshow(outCanvas, final);

    // 자원 해제
    src.delete(); dst.delete(); gray.delete(); intermediate.delete(); 
    blurred.delete(); final.delete(); clahe.delete();

    return outCanvas;
  } catch (error) {
    console.error('OpenCV 전처리 중 에러:', error);
    return canvas;
  }
};
