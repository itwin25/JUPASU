import * as ort from 'onnxruntime-web';

// WASM 경로 설정
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

let detSession: ort.InferenceSession | null = null;
let recSession: ort.InferenceSession | null = null;
let dictionary: string[] = [];

// PaddleOCR 상수
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/**
 * 1. 이미지 전처리 (HWC -> CHW, Normalization)
 */
function preprocess(imageData: Uint8ClampedArray, width: number, height: number): ort.Tensor {
  const float32Data = new Float32Array(3 * width * height);
  for (let i = 0; i < width * height; i++) {
    float32Data[i] = (imageData[i * 4] / 255.0 - MEAN[0]) / STD[0];
    float32Data[i + width * height] = (imageData[i * 4 + 1] / 255.0 - MEAN[1]) / STD[1];
    float32Data[i + 2 * width * height] = (imageData[i * 4 + 2] / 255.0 - MEAN[2]) / STD[2];
  }
  return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

/**
 * 2. CTC Greedy Decoder (인식 결과 -> 텍스트)
 */
function decode(logits: Float32Array, shape: number[]): { text: string; score: number } {
  const [batch, steps, charCount] = shape;
  let text = '';
  let totalScore = 0;
  let lastCharIdx = -1;

  for (let i = 0; i < steps; i++) {
    let maxIdx = 0;
    let maxProb = -Infinity;
    const offset = i * charCount;

    for (let j = 0; j < charCount; j++) {
      if (logits[offset + j] > maxProb) {
        maxProb = logits[offset + j];
        maxIdx = j;
      }
    }

    // 0번(blank)이 아니고, 이전 글자와 중복되지 않을 때만 추가
    if (maxIdx > 0 && maxIdx !== lastCharIdx) {
      text += dictionary[maxIdx - 1] || '';
      totalScore += maxProb;
    }
    lastCharIdx = maxIdx;
  }

  return { text, score: totalScore / (text.length || 1) };
}

/**
 * 3. 단순화된 DB Post-processing (Heatmap -> Boxes)
 * (실제 OpenCV의 findContours 대신 픽셀 클러스터링 기반 단순 구현)
 */
function getBoxesFromHeatmap(heatmap: Float32Array, width: number, height: number, threshold = 0.3) {
  // 실제 서비스 환경에서는 연결 요소 분석(Connected Components)이나 
  // 경계선 추출 알고리즘이 필요합니다. 
  // 여기서는 성능과 코드 크기를 위해 전체 영역에서 유의미한 텍스트 덩어리를 찾는 구조를 제안합니다.
  
  // TODO: 브라우저용 경량화된 findContours 로직 추가 이식 가능
  return [{ x: 0, y: 0, w: width, h: height }]; // 현재는 전체 영역 반환 (테스트용)
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  try {
    if (type === 'INIT') {
      const { detModelUrl, recModelUrl, dictUrl } = payload;
      
      const sessionOptions: ort.InferenceSession.SessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      };

      console.log('📦 [Worker] 모델 및 딕셔너리 로딩...');
      
      const [det, rec, dictResponse] = await Promise.all([
        ort.InferenceSession.create(detModelUrl, sessionOptions),
        ort.InferenceSession.create(recModelUrl, sessionOptions),
        fetch(dictUrl).then(res => res.text())
      ]);

      detSession = det;
      recSession = rec;
      dictionary = dictResponse.split(/\r?\n/).filter(line => line.trim() !== '');
      // PaddleOCR 딕셔너리 특성상 맨 앞에 blank 추가
      dictionary.unshift('blank');

      self.postMessage({ type: 'INIT_COMPLETE' });
      console.log('✅ [Worker] 준비 완료');
    }

    if (type === 'PROCESS') {
      if (!detSession || !recSession) throw new Error('Models not initialized');

      const { imageData, width, height } = payload;
      const dataArray = new Uint8ClampedArray(imageData);

      // --- STEP 1: Detection (글자 위치 찾기) ---
      const detInput = preprocess(dataArray, width, height);
      const detResults = await detSession.run({ 'x': detInput });
      const heatmap = detResults[Object.keys(detResults)[0]].data as Float32Array;
      
      const boxes = getBoxesFromHeatmap(heatmap, width, height);
      console.log(`🔍 [Worker] ${boxes.length}개의 텍스트 영역 검출`);

      // --- STEP 2: Recognition (각 영역 글자 읽기) ---
      let fullText = '';
      let avgScore = 0;

      for (const box of boxes) {
        // [참고] 실제로는 box 영역만 crop하여 48px 높이로 리사이징하는 과정이 필요함
        // 여기서는 전체 이미지를 한 번에 인식 모델에 넣는 구조로 시뮬레이션
        const recInput = preprocess(dataArray, width, height); 
        const recResults = await recSession.run({ 'x': recInput });
        const logits = recResults[Object.keys(recResults)[0]];
        
        const decoded = decode(logits.data as Float32Array, logits.dims);
        fullText += decoded.text + ' ';
        avgScore += decoded.score;
      }

      self.postMessage({ 
        type: 'PROCESS_COMPLETE', 
        payload: { 
          text: fullText.trim(), 
          score: avgScore / (boxes.length || 1)
        } 
      });
    }
  } catch (error: any) {
    console.error('❌ [Worker] 에러:', error);
    self.postMessage({ type: 'ERROR', payload: error.message });
  }
};
