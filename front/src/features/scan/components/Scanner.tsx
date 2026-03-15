/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import LoadingSpinner from '@/components/common/loading-spinner/LoadingSpinner';
import { useOCR } from '../hooks/useOCR';
import { OCRResult } from '../types';

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 🚀 이전 캡처 이미지 URL 해제 (메모리 관리)
  useEffect(() => {
    return () => {
      if (capturedImage && capturedImage.startsWith('blob:')) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);
const { isLoaded, isLoading: isModelLoading, error: modelError, initOCR, executeOCR, executeServerOCR } = useOCR();

/* 🚀 [비활성화] 클라이언트 모델 로드 중단
useEffect(() => {
  initOCR();
}, [initOCR]);
*/

// 🚀 서버 사이드 OCR 호출 테스트 함수
const handleServerScan = useCallback(async () => {
  if (!videoRef.current || !canvasRef.current) return;

  const video = videoRef.current;
  const canvas = canvasRef.current;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);

  setIsCapturing(true);
  try {
    const serverResult = await executeServerOCR(canvas);
    alert(`서버 분석 성공: ${serverResult.message}\n인식 모델: ${serverResult.info.detInputs[0]}`);

    // 카메라 끄기
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setCapturedImage('https://via.placeholder.com/512?text=Server+Scan+Success'); // 임시
  } catch (err) {
    alert('서버 분석 실패');
  } finally {
    setIsCapturing(false);
  }
}, [executeServerOCR, stream]);

// 🚀 서버 사이드 전용 OCR 처리 로직
const processServerOCRResults = useCallback(
  async (imageSource: HTMLCanvasElement | HTMLImageElement) => {
    // 카메라 스트림 즉시 종료
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsCapturing(true);
    try {
      let canvas: HTMLCanvasElement;
      if (imageSource instanceof HTMLCanvasElement) {
        canvas = imageSource;
      } else {
        canvas = document.createElement('canvas');
        canvas.width = imageSource.naturalWidth;
        canvas.height = imageSource.naturalHeight;
        canvas.getContext('2d')?.drawImage(imageSource, 0, 0);
      }

      const serverResult = await executeServerOCR(canvas);
      console.log('✅ [Main] 서버 OCR 응답:', serverResult);

      // 🚀 서버에서 정제하여 보낸 실제 결과 데이터를 그대로 사용
      const actualResults = serverResult.results || [];

      setCapturedImage(null); // 무거운 이미지 렌더링 생략 (텍스트 결과만 확인)
      setResults(actualResults);
    } catch (err) {
      console.error('Server Scan failed:', err);
      alert('서버 텍스트 분석 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  },
  [executeServerOCR, stream]
);

// 🚀 기존 엣지 디바이스(클라이언트) OCR 처리 로직 (보존)
const processClientOCRResults = useCallback(
  async (imageSource: HTMLCanvasElement | HTMLImageElement) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setIsCapturing(true);
    try {
      const { results: ocrResults, debugImage } = await executeOCR(imageSource);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📖 [Main] 클라이언트 OCR 인식 결과:');
      if (ocrResults && ocrResults.length > 0) {
        ocrResults.forEach((res, idx) => {
          console.log(`[${idx + 1}] 텍스트: "${res.text}" | 신뢰도: ${(res.score * 100).toFixed(1)}%`);
        });
      } else {
        console.log('❌ 인식된 결과가 없습니다.');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      setCapturedImage(null); 
      setResults(ocrResults);
    } catch (err) {
      console.error('Client Scan failed:', err);
      alert('클라이언트 텍스트 분석 중 오류가 발생했습니다.');
    } finally {
      setIsCapturing(false);
    }
  },
  [executeOCR, stream],
);

// 기본적으로 서버 로직을 사용하도록 변경
const captureAndScan = useCallback(async () => {
  if (!videoRef.current || !canvasRef.current || !isLoaded) return;

  const video = videoRef.current;
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  const canvas = canvasRef.current;
  const context = canvas.getContext('2d');
  if (context) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // 🚀 모든 접속에서 기본으로 서버 사이드 연산을 수행
      await processServerOCRResults(canvas);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}, [isLoaded, processServerOCRResults]);

// 파일 업로드 시에도 기본으로 서버 연산 사용
const handleFileUpload = useCallback(
  async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLoaded) return;

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      // 🚀 서버 사이드 분석 호출
      processServerOCRResults(img);
      URL.revokeObjectURL(objectUrl);
      img.onload = null;
      img.src = '';
    };
    img.src = objectUrl;
  },
  [isLoaded, processServerOCRResults],
);
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          // 🚀 발열 감소를 위해 해상도를 1080p -> 720p로 하향
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !stream && !capturedImage) {
      startCamera();
    }
  }, [isLoaded, stream, capturedImage, startCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error('Video play failed:', e));
    }
  }, [stream, isLoaded]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const resetScanner = useCallback(async () => {
    setResults([]);
    setCapturedImage(null);
    startCamera();
    // 🚀 워커가 파괴되었으므로 다시 초기화
    await initOCR();
  }, [startCamera, initOCR]);

  if (modelError) {
    return (
      <div className="space-y-4 p-6 text-center">
        <p className="font-medium text-red-500">{modelError}</p>
        <Button onClick={initOCR}>다시 시도</Button>
      </div>
    );
  }

  if (isModelLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-12">
        <LoadingSpinner />
        <p className="text-text-main/60">OCR 인공지능 모델을 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col space-y-6">
      <div className="border-primary-100 relative aspect-square w-full overflow-hidden rounded-[2rem] border-2 bg-black shadow-inner">
        {!capturedImage ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="relative h-full w-full">
            <img src={capturedImage} alt="Captured" className="h-full w-full object-contain" />
            
            {/* 🚀 CSS 기반 OCR 결과 박스 Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative h-full w-full overflow-hidden">
                {results.map((res, idx) => {
                  if (!res.box) return null;
                  
                  // PaddleOCR의 좌표(box)는 [x,y] 4개의 배열임 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                  // 단순화를 위해 x_min, y_min, width, height 계산
                  let xMin = 10000, yMin = 10000, xMax = 0, yMax = 0;
                  
                  if (Array.isArray(res.box) && Array.isArray(res.box[0])) {
                    res.box.forEach((pt: any) => {
                      xMin = Math.min(xMin, pt[0]);
                      yMin = Math.min(yMin, pt[1]);
                      xMax = Math.max(xMax, pt[0]);
                      yMax = Math.max(yMax, pt[1]);
                    });
                  } else if (Array.isArray(res.box) && res.box.length === 4) {
                    // [x, y, w, h] 형식인 경우
                    const [x, y, w, h] = res.box as any;
                    xMin = x; yMin = y; xMax = x + w; yMax = y + h;
                  }

                  // 512px 기준 좌표를 %로 변환 (object-contain 보정은 브라우저가 담당)
                  // ⚠️ 여기서는 512px 기준으로 리사이징되었음을 가정
                  const left = (xMin / 512) * 100;
                  const top = (yMin / 512) * 100;
                  const width = ((xMax - xMin) / 512) * 100;
                  const height = ((yMax - yMin) / 512) * 100;

                  return (
                    <div
                      key={idx}
                      className="absolute border-2 border-green-400 bg-green-500/10"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="absolute -top-5 left-0 whitespace-nowrap bg-black/60 px-1 text-[8px] font-bold text-white">
                        {res.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {isCapturing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40 text-white">
            <RefreshCw className="animate-spin" size={40} />
            <p className="font-bold">분석 중...</p>
          </div>
        )}
      </div>

      {/* 캔버스 및 파일 입력 (숨김) */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileUpload}
      />

      <div className="flex flex-col space-y-4">
        {!capturedImage ? (
          <div className="flex flex-col space-y-2">
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="primary"
                className="col-span-3 h-16 rounded-2xl text-lg shadow-lg"
                onClick={captureAndScan}
                disabled={!isLoaded || isCapturing}
              >
                <Camera className="mr-2" />
                촬영 및 분석
              </Button>
              <Button
                variant="outline"
                className="border-primary-200 text-primary-700 col-span-1 h-16 rounded-2xl bg-white shadow-md"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isLoaded || isCapturing}
              >
                <ImageIcon size={28} />
              </Button>
            </div>
            
            {/* 🚀 기존 엣지 디바이스 분석 유지 (테스트/비상용) */}
            <Button
              variant="outline"
              className="h-12 border-dashed border-primary-300 text-primary-500 hover:bg-primary-50"
              onClick={async () => {
                if (!videoRef.current || !canvasRef.current || !isLoaded) return;
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                await processClientOCRResults(canvas);
              }}
              disabled={isCapturing}
            >
              기기 내부 연산 (Client 엣지 테스트)
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-primary-100 max-h-48 overflow-y-auto rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-primary-700 mb-3 flex items-center font-bold">
                <CheckCircle2 size={20} className="mr-2" />
                분석 결과
              </div>
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((res, idx) => (
                    <div
                      key={idx}
                      className="bg-primary-50 border-primary-100/50 rounded-lg border p-2 text-sm"
                    >
                      <span className="text-text-main font-medium">{res.text}</span>
                      <span className="text-text-main/40 ml-2 text-[10px]">
                        {(res.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-main/40 py-4 text-center italic">
                  텍스트를 찾지 못했습니다.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-2xl" onClick={resetScanner}>
                다시 시도
              </Button>
              <Button variant="primary" className="h-14 rounded-2xl shadow-md">
                이 정보로 검색
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
