'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, Image as ImageIcon, Zap, Search } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { useOCR } from '../hooks/useOCR';
import { useOnDeviceGPUOCR as useOnDeviceOCR } from '../hooks/useOnDeviceGPUOCR';
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
  const {
    recognize: scanLocally,
    isReady: localReady,
    isProcessing: isLocalProcessing,
  } = useOnDeviceOCR();

  // 🚀 공통 카메라 중지 로직
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // 🚀 서버 사이드 OCR 처리 로직
  const processServerOCR = useCallback(
    async (imageSource: HTMLCanvasElement | HTMLImageElement) => {
      stopCamera();
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

        const result = await executeOCR(canvas);
        console.log('✅ [Main] 서버 OCR 응답:', result);

        setResults(result.results || []);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      } catch (err) {
        console.error('Server OCR failed:', err);
        alert('서버 분석 중 오류가 발생했습니다.');
      } finally {
        setIsCapturing(false);
      }
    },
    [executeOCR, stopCamera],
  );

  // 🚀 온디바이스(로컬) OCR 처리 로직
  const processLocalOCR = useCallback(
    async (imageSource: HTMLCanvasElement | HTMLImageElement) => {
      stopCamera();
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

        const result = await scanLocally(canvas);
        console.log('✅ [Main] 온디바이스 OCR 응답:', result);

        interface RefinedOCRData {
          winery?: string;
          wineName?: string;
          data?: {
            winery?: string;
            wineName?: string;
          };
        }

        if (result.success && result.refined) {
          const refined = result.refined as RefinedOCRData;
          // 온디바이스 결과 텍스트를 화면에 표시
          const winery = refined.data?.winery || refined.winery;
          const wineName = refined.data?.wineName || refined.wineName;

          if (wineName || winery) {
            const displayResults: OCRResult[] = [];
            if (winery) displayResults.push({ text: winery, score: 0.9, box: [] });
            if (wineName) displayResults.push({ text: wineName, score: 0.9, box: [] });
            setResults(displayResults);
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
      } catch (err) {
        console.error('Local OCR failed:', err);
        alert('로컬 분석 중 오류가 발생했습니다.');
      } finally {
        setIsCapturing(false);
      }
    },
    [scanLocally, stopCamera],
  );

  const captureAndScanServer = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        await processServerOCR(canvas);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }, [processServerOCR]);

  const captureAndScanLocal = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      try {
        await processLocalOCR(canvas);
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }, [processLocalOCR]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        // 파일 업로드는 기본적으로 정밀 스캔(서버)으로 처리
        processServerOCR(img);
        URL.revokeObjectURL(objectUrl);
        img.onload = null;
        img.src = '';
      };
      img.src = objectUrl;
    },
    [processServerOCR],
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

  const isAnyProcessing = isCapturing || isOcrLoading || isLocalProcessing;

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
          </div>
        )}
        {isAnyProcessing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40 text-white">
            <RefreshCw className="animate-spin" size={40} />
            <p className="font-bold">분석 중...</p>
          </div>
        )}
      </div>

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
          <div className="flex flex-col space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="primary"
                className="h-16 rounded-2xl text-base font-bold shadow-lg"
                onClick={captureAndScanLocal}
                disabled={isAnyProcessing || !localReady}
              >
                <Zap className="mr-2 fill-current" size={20} />
                빠른 스캔
              </Button>
              <Button
                variant="primary"
                className="h-16 rounded-2xl text-base font-bold shadow-lg"
                onClick={captureAndScanServer}
                disabled={isAnyProcessing}
              >
                <Search className="mr-2" size={20} />
                정밀 스캔
              </Button>
            </div>
            <Button
              variant="outline"
              className="border-primary-200 text-primary-700 h-14 rounded-2xl bg-white shadow-md"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnyProcessing}
            >
              <ImageIcon className="mr-2" size={20} />
              앨범에서 불러오기
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
