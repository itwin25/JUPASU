'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import LoadingSpinner from '@/components/common/loading-spinner/LoadingSpinner';
import { useOCR } from '../hooks/useOCR';
import { OCRResult } from '../types';

export default function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [results, setResults] = useState<OCRResult[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const { isLoaded, isLoading: isModelLoading, error: modelError, initOCR, executeOCR } = useOCR();

  useEffect(() => {
    initOCR();
  }, [initOCR]);
// 2. 카메라 권한 획득 및 스트림 가져오기
const startCamera = useCallback(async () => {
  try {
    const constraints = {
      video: { 
        facingMode: 'environment',
        // 특정 해상도를 강제하지 않고 기기가 제공하는 기본 원본 화질을 그대로 사용
      },
    };
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    setStream(newStream);
  } catch (err) {
    console.error('Error accessing camera:', err);
    alert('카메라 접근 권한이 필요합니다.');
  }
}, []);

  useEffect(() => {
    if (isLoaded && !stream) {
      startCamera();
    }
  }, [isLoaded, stream, startCamera]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
  }, [stream, isLoaded, capturedImage]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsCapturing(true);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // 1. 카메라 하드웨어가 제공하는 원본 해상도 그대로 캔버스 크기 설정
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log(`📸 [RAW CAPTURE] 카메라 원본 해상도: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`🎨 [CANVAS] 전처리로 전달되는 캔버스 크기: ${canvas.width}x${canvas.height}`);
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      try {
        // 2. OCR 실행 (내부에서 전처리 수행)
        const { results: ocrResults, debugImage } = await executeOCR(canvas);
        
        // 3. 전처리된 이미지를 캔버스에 다시 그리기 위해 Image 객체 생성
        const img = new window.Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 캔버스 크기를 전처리된 이미지 크기(1280px 등)에 맞춤
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // 4. 전처리된 이미지 위에 박스 그리기
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.font = 'bold 16px sans-serif';

            ocrResults.forEach((res) => {
              if (!res.box) return;
              ctx.beginPath();
              if (typeof res.box === 'object' && 'x' in res.box) {
                const { x, y, width, height } = res.box as any;
                ctx.rect(x, y, width, height);
                ctx.stroke(); ctx.fill();
                if (res.text) ctx.fillText(res.text, x, y - 5);
              } else if (Array.isArray(res.box) && res.box.length >= 4) {
                ctx.moveTo(res.box[0][0], res.box[0][1]);
                for (let i = 1; i < res.box.length; i++) ctx.lineTo(res.box[i][0], res.box[i][1]);
                ctx.closePath(); ctx.stroke(); ctx.fill();
                if (res.text) ctx.fillText(res.text, res.box[0][0], res.box[0][1] - 5);
              }
            });

            // 5. 최종 결과(전처리+박스)를 화면에 표시
            setCapturedImage(canvas.toDataURL('image/jpeg'));
          }
        };
        img.src = debugImage;
        setResults(ocrResults);

        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      } catch (err) {
        console.error('Scan failed:', err);
        alert('텍스트 분석 중 오류가 발생했습니다.');
      } finally {
        setIsCapturing(false);
      }
    }
  }, [isLoaded, executeOCR, stream]);

  const resetScanner = useCallback(() => {
    setResults([]);
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  if (modelError) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-red-500 font-medium">{modelError}</p>
        <Button onClick={initOCR}>다시 시도</Button>
      </div>
    );
  }

  if (isModelLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <LoadingSpinner />
        <p className="text-text-main/60">OCR 인공지능 모델을 불러오고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      <div className="relative w-full aspect-[3/4] bg-black rounded-[2rem] overflow-hidden border-2 border-primary-100 shadow-inner">
        {!capturedImage ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
        {isCapturing && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white space-y-2">
            <RefreshCw className="animate-spin" size={40} />
            <p className="font-bold">분석 중...</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex flex-col space-y-4">
        {!capturedImage ? (
          <Button variant="primary" size="full" className="shadow-lg h-16 text-lg" onClick={captureAndScan} disabled={!isLoaded || isCapturing}>
            <Camera className="mr-2" />
            촬영 및 분석하기
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm max-h-48 overflow-y-auto">
              <div className="flex items-center mb-3 text-primary-700 font-bold">
                <CheckCircle2 size={20} className="mr-2" />
                분석 결과
              </div>
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((res, idx) => (
                    <div key={idx} className="text-sm p-2 bg-primary-50 rounded-lg border border-primary-100/50">
                      <span className="font-medium text-text-main">{res.text}</span>
                      <span className="ml-2 text-[10px] text-text-main/40">{(res.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-main/40 text-center py-4 italic">텍스트를 찾지 못했습니다.</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={resetScanner}>다시 촬영</Button>
              <Button variant="primary">이 정보로 검색</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
