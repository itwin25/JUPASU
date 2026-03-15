const fs = require('fs');
const path = require('path');

global.self = global;
require('paddleocr/dist/index.js');
const { PaddleOcrService } = global.paddleocr;
const ort = require('onnxruntime-node');

async function test() {
  const modelDir = path.join(process.cwd(), 'public', 'models', 'optimized_final');
  const detBuffer = fs.readFileSync(path.join(modelDir, 'det_mobile.onnx'));
  const recBuffer = fs.readFileSync(path.join(modelDir, 'rec_mobile_latin.onnx'));
  const dictText = fs.readFileSync(path.join(modelDir, 'dicts', 'mobile_latin_dict.txt'), 'utf-8');

  const cpuOptions = { executionProviders: ['cpu'], graphOptimizationLevel: 'all' };

  PaddleOcrService.prototype.initialize = async function () {
    this.detectionSession = await ort.InferenceSession.create(detBuffer, cpuOptions);
    this.recognitionSession = await ort.InferenceSession.create(recBuffer, cpuOptions);
    this.detectionService = new global.paddleocr.DetectionService(ort, this.detectionSession, this.options.detection);
    this.recognitionService = new global.paddleocr.RecognitionService(ort, this.recognitionSession, this.options.recognition);
  };

  const ocrService = await PaddleOcrService.createInstance({
    ort: ort,
    detection: { modelBuffer: detBuffer, limitSideLen: 640 },
    recognition: { modelBuffer: recBuffer, charactersDictionary: dictText.replace(/\r/g, '').split('\n') },
  });

  // Dummy 640x640 RGBA image
  const pixelData = new Uint8Array(640 * 640 * 4);
  pixelData.fill(255);

  console.log('Running recognize...');
  const res = await ocrService.recognize({ width: 640, height: 640, data: pixelData });
  console.log('Result type:', typeof res);
  console.log('Result isArray:', Array.isArray(res));
  console.log('Result details:', JSON.stringify(res, null, 2));
}

test().catch(console.error);
