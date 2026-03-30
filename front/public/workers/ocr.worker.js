// 워커 로드 즉시 생존 신고
self.postMessage({ type: 'LOG', payload: '워커 스크립트 로드 성공' });

// 로컬 경로의 ort.min.js 사용 (CDN 이슈 방지)
importScripts('/workers/ort.min.js');

// WASM 경로 및 동적 모듈 로드 경로를 로컬 /workers/ 폴더로 강제 지정
self.ort.env.wasm.wasmPaths = '/workers/';

let detSession = null;
let recSession = null;
let dictionary = [];

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

function logToMain(msg) {
  console.log(`[Worker] ${msg}`);
  self.postMessage({ type: 'LOG', payload: msg });
}

function createTensor(imageData, width, height) {
  const float32Data = new Float32Array(3 * width * height);
  for (let i = 0; i < width * height; i++) {
    float32Data[i] = (imageData[i * 4] / 255.0 - MEAN[0]) / STD[0];
    float32Data[i + width * height] = (imageData[i * 4 + 1] / 255.0 - MEAN[1]) / STD[1];
    float32Data[i + 2 * width * height] = (imageData[i * 4 + 2] / 255.0 - MEAN[2]) / STD[2];
  }
  return new self.ort.Tensor('float32', float32Data, [1, 3, height, width]);
}

async function resizeImage(source, sw, sh, tw, th) {
  const canvas = new OffscreenCanvas(tw, th);
  const ctx = canvas.getContext('2d');
  const tempCanvas = new OffscreenCanvas(sw, sh);
  const tempCtx = tempCanvas.getContext('2d');
  const imgData = tempCtx.createImageData(sw, sh);
  imgData.data.set(source);
  tempCtx.putImageData(imgData, 0, 0);
  
  // 리사이징 품질 최상으로 설정
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, tw, th);
  return ctx.getImageData(0, 0, tw, th).data;
}

// 읽는 순서대로 박스 정렬
function sortBoxesByReadingOrder(boxes) {
  return boxes.sort((boxA, boxB) => {
    if (Math.abs(boxA.y - boxB.y) < (boxA.h + boxB.h) * 0.3) {
      return boxA.x - boxB.x;
    }
    return boxA.y - boxB.y;
  });
}

function decode(logits, shape) {
  const [batch, steps, charCount] = shape;
  let text = '';
  let scores = [];
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

    if (maxIdx === lastCharIdx) continue;
    lastCharIdx = maxIdx;
    if (maxIdx === 0) continue;

    const char = dictionary[maxIdx];
    if (char && char !== 'blank') {
      text += char;
      scores.push(maxProb);
    }
  }

  const confidence = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { text, score: confidence };
}

function getBoxesFromHeatmap(heatmap, hWidth, hHeight, origW, origH, threshold = 0.3) {
  const initialBoxes = [];
  const visited = new Uint8Array(heatmap.length);

  for (let i = 0; i < heatmap.length; i++) {
    if (heatmap[i] > threshold && visited[i] === 0) {
      let minX = hWidth, minY = hHeight, maxX = 0, maxY = 0;
      const queue = [i];
      visited[i] = 1;
      let area = 0;

      while (queue.length > 0) {
        const curr = queue.shift();
        area++;
        const cx = curr % hWidth;
        const cy = Math.floor(curr / hWidth);

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const left = curr - 1;
        const right = curr + 1;
        const up = curr - hWidth;
        const down = curr + hWidth;

        if (cx > 0 && visited[left] === 0 && heatmap[left] > threshold) { visited[left] = 1; queue.push(left); }
        if (cx < hWidth - 1 && visited[right] === 0 && heatmap[right] > threshold) { visited[right] = 1; queue.push(right); }
        if (cy > 0 && visited[up] === 0 && heatmap[up] > threshold) { visited[up] = 1; queue.push(up); }
        if (cy < hHeight - 1 && visited[down] === 0 && heatmap[down] > threshold) { visited[down] = 1; queue.push(down); }
      }

      if (area > 5 && (maxX - minX) > 2 && (maxY - minY) > 2) {
        initialBoxes.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
      }
    }
  }

  const scaleX = origW / hWidth;
  const scaleY = origH / hHeight;
  const paddingVertical = 0.1;
  const paddingHorizontal = 0.05;

  return initialBoxes.map(rect => {
    const vPad = Math.round(rect.h * paddingVertical);
    const hPad = Math.round(rect.w * paddingHorizontal);
    let x = Math.max(0, (rect.x - hPad) * scaleX);
    let y = Math.max(0, (rect.y - vPad) * scaleY);
    let w = Math.min(origW - x, (rect.w + 2 * hPad) * scaleX);
    let h = Math.min(origH - y, (rect.h + 2 * vPad) * scaleY);
    return { x, y, w, h };
  }).filter(b => b.w > 10 && b.h > 10);
}

self.addEventListener('message', async (e) => {
  const { type, payload } = e.data;
  try {
    if (type === 'INIT') {
      const { detModelUrl, recModelUrl, dictUrl } = payload;
      const options = { executionProviders: ['wasm'], graphOptimizationLevel: 'basic' };
      logToMain('모델 로딩 시작...');
      const [det, rec, dictRes] = await Promise.all([
        self.ort.InferenceSession.create(detModelUrl, options),
        self.ort.InferenceSession.create(recModelUrl, options),
        fetch(dictUrl).then(res => res.text())
      ]);
      detSession = det;
      recSession = rec;
      dictionary = ['blank', ...dictRes.split(/\r?\n/).filter(line => line.trim() !== '')];
      self.postMessage({ type: 'INIT_COMPLETE' });
      logToMain('초기화 완료');
    }
    
    if (type === 'PROCESS') {
      const { imageData, width, height } = payload;
      const dataArray = new Uint8ClampedArray(imageData);

      const MAX_SIDE_LEN = 960;
      let ratio = 1;
      if (width > height) {
        if (width > MAX_SIDE_LEN) ratio = MAX_SIDE_LEN / width;
      } else {
        if (height > MAX_SIDE_LEN) ratio = MAX_SIDE_LEN / height;
      }
      
      let detW = Math.max(32, Math.floor((width * ratio) / 32) * 32);
      let detH = Math.max(32, Math.floor((height * ratio) / 32) * 32);

      logToMain(`이미지 처리: ${width}x${height} -> ${detW}x${detH}`);

      const detResized = await resizeImage(dataArray, width, height, detW, detH);
      const detInput = createTensor(detResized, detW, detH);
      const detResults = await detSession.run({ [detSession.inputNames[0]]: detInput });
      const heatmap = detResults[detSession.outputNames[0]].data;
      
      let boxes = getBoxesFromHeatmap(heatmap, detW, detH, width, height);
      boxes = sortBoxesByReadingOrder(boxes);
      
      logToMain(`박스 발견: ${boxes.length}개`);
      
      let finalTexts = [];
      let scoresSum = 0;
      const THRESHOLD = 0.7;

      // 캔버스 재사용
      const tempCanvas = new OffscreenCanvas(width, height);
      const tempCtx = tempCanvas.getContext('2d');
      const imgData = tempCtx.createImageData(width, height);
      imgData.data.set(dataArray);
      tempCtx.putImageData(imgData, 0, 0);

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        const targetH = 48;
        const targetW = Math.max(48, Math.floor((box.w / box.h) * targetH));
        
        const recCanvas = new OffscreenCanvas(targetW, targetH);
        const recCtx = recCanvas.getContext('2d');
        recCtx.drawImage(tempCanvas, box.x, box.y, box.w, box.h, 0, 0, targetW, targetH);
        
        const recResized = recCtx.getImageData(0, 0, targetW, targetH).data;
        const recInput = createTensor(recResized, targetW, targetH);
        const recResults = await recSession.run({ [recSession.inputNames[0]]: recInput });
        const logits = recResults[recSession.outputNames[0]];
        const decoded = decode(logits.data, logits.dims);
        
        logToMain(`[Box #${i+1}] "${decoded.text}" (${(decoded.score).toFixed(3)})`);
        
        if (decoded.text && decoded.score >= THRESHOLD) {
          finalTexts.push(decoded.text);
          scoresSum += decoded.score;
        }
      }
      
      const finalResultText = finalTexts.join('\n') || 'unknown';
      const finalScore = finalTexts.length > 0 ? scoresSum / finalTexts.length : 0;
      
      logToMain(`최종 결과 취합 완료 (${finalTexts.length}개 박스 채택)`);

      self.postMessage({ 
        type: 'PROCESS_COMPLETE', 
        payload: { text: finalResultText, score: finalScore } 
      });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', payload: error.message });
  }
});
