'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/button/Button';
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

  const { executeOCR, error: ocrError, isLoading: isOcrLoading } = useOCR();

  // 🚀 OCR 처리 로직
  const processOCR = useCallback(
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

        // 🚀 서버 사이드 분석 호출
        const result = await executeOCR(canvas);
        console.log('✅ [Main] 서버 OCR 응답:', result);

        setResults(result.results || []);

        // 캡처한 이미지를 프리뷰로 설정
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      } catch (err) {
        console.error('OCR failed:', err);
        alert('텍스트 분석 중 오류가 발생했습니다.');
      } finally {
        setIsCapturing(false);
      }
    },
    [executeOCR, stream],
  );

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

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
        await processOCR(canvas);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }, [processOCR]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        processOCR(img);
        URL.revokeObjectURL(objectUrl);
        img.onload = null;
        img.src = '';
      };
      img.src = objectUrl;
    },
    [processOCR],
  );

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
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
    if (!stream && !capturedImage) {
      startCamera();
    }
  }, [stream, capturedImage, startCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.error('Video play failed:', e));
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const resetScanner = useCallback(() => {
    setResults([]);
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

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
            <div className="absolute inset-0">
              <div className="relative h-full w-full">
                {results.map((res, idx) => {
                  if (!res.box) return null;

                  // 박스 좌표 계산 (서버에서 받은 좌표 [[x,y], ...])
                  let xMin = 10000,
                    yMin = 10000,
                    xMax = 0,
                    yMax = 0;

                  if (Array.isArray(res.box) && Array.isArray(res.box[0])) {
                    (res.box as number[][]).forEach((pt) => {
                      xMin = Math.min(xMin, pt[0]);
                      yMin = Math.min(yMin, pt[1]);
                      xMax = Math.max(xMax, pt[0]);
                      yMax = Math.max(yMax, pt[1]);
                    });
                  }

                  // ⚠️ 좌표를 %로 표시하기 위해서는 원본 이미지 사이즈 대비 비율이 필요함
                  // 현재 서버 OCR에서 리사이징을 하므로 좌표 보정이 복잡할 수 있음.
                  // 우선은 원본 이미지 비율대로 표시한다고 가정.

                  // 임시: 박스 그리기를 비활성화하거나 정교화 작업 필요
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
        {(isCapturing || isOcrLoading) && (
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
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="primary"
              className="col-span-3 h-16 rounded-2xl text-lg shadow-lg"
              onClick={captureAndScan}
              disabled={isCapturing || isOcrLoading}
            >
              <Camera className="mr-2" />
              촬영 및 분석
            </Button>
            <Button
              variant="outline"
              className="border-primary-200 text-primary-700 col-span-1 h-16 rounded-2xl bg-white shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCapturing || isOcrLoading}
            >
              <ImageIcon size={28} />
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
            {ocrError && <p className="text-xs text-red-500">{ocrError}</p>}
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
