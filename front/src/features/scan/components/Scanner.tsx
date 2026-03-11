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

  const { isLoaded, isLoading: isModelLoading, error: modelError, initOCR, executeOCR } = useOCR();

  useEffect(() => {
    initOCR();
  }, [initOCR]);

  // 공통 OCR 처리 로직
  const processOCRResults = useCallback(async (imageSource: HTMLCanvasElement | HTMLImageElement) => {
    const width = imageSource instanceof HTMLCanvasElement ? imageSource.width : imageSource.naturalWidth;
    const height = imageSource instanceof HTMLCanvasElement ? imageSource.height : imageSource.naturalHeight;
    console.log(`🔍 [OCR Input] Image Dimensions: ${width}x${height}`);
    
    setIsCapturing(true);
    try {
      const { results: ocrResults, debugImage } = await executeOCR(imageSource);
      console.log('🎨 Drawing results onto image:', ocrResults);
      
      const img = new window.Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        console.log(`🎨 [Canvas Size] ${offscreenCanvas.width}x${offscreenCanvas.height}`);
        const ctx = offscreenCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // 🚀 시인성 보강 및 글자 가독성 유지 설정
          ctx.strokeStyle = '#00FF00'; // 테두리: 선명한 연두색
          ctx.lineWidth = Math.max(img.width / 400, 2); // 테두리 두께 최적화
          ctx.fillStyle = 'rgba(0, 255, 0, 0.05)'; // 🚀 채우기: 아주 연한 투명색 (글자 훼손 방지)
          
          ocrResults.forEach((res) => {
            if (!res.box) return;
            
            ctx.beginPath();
            
            // 좌표 형식 처리
            if (Array.isArray(res.box) && Array.isArray(res.box[0])) {
              ctx.moveTo(res.box[0][0], res.box[0][1]);
              for (let i = 1; i < res.box.length; i++) {
                ctx.lineTo(res.box[i][0], res.box[i][1]);
              }
              ctx.closePath();
            } 
            else if (Array.isArray(res.box) && res.box.length === 4) {
              const [x, y, w, h] = res.box;
              ctx.rect(x, y, w, h);
            }
            else if (typeof res.box === 'object' && 'x' in res.box) {
              const b = res.box as any;
              ctx.rect(b.x, b.y, b.width, b.height);
            }

            ctx.fill(); // 연한 배경 칠하기
            ctx.stroke(); // 테두리 그리기

            // 🚀 텍스트 라벨 개선 (박스 상단에 검은 배경 + 흰 글씨로 작게 표시)
            if (res.text) {
              const x = Array.isArray(res.box[0]) ? res.box[0][0] : (res.box as any).x || res.box[0];
              const y = Array.isArray(res.box[0]) ? res.box[0][1] : (res.box as any).y || res.box[1];
              
              const fontSize = Math.max(img.width / 60, 12);
              ctx.font = `bold ${fontSize}px sans-serif`;
              
              // 라벨 배경
              const textWidth = ctx.measureText(res.text).width;
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillRect(x, y - fontSize - 4, textWidth + 6, fontSize + 4);
              
              // 라벨 텍스트
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(res.text, x + 3, y - 5);
              
              // 다음 박스를 위해 fillStyle 복구
              ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
            }
          });

          const finalDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.95);
          setCapturedImage(finalDataUrl);
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
  }, [executeOCR, stream]);

  // 카메라 촬영 및 분석
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
      await processOCRResults(canvas);
    }
  }, [isLoaded, processOCRResults]);

  // 파일 업로드 및 분석
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isLoaded) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => processOCRResults(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [isLoaded, processOCRResults]);

  const startCamera = useCallback(async () => {
    try {
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
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
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
    }
  }, [stream, isLoaded]);

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
      <div className="relative w-full aspect-square bg-black rounded-[2rem] overflow-hidden border-2 border-primary-100 shadow-inner">
        {!capturedImage ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        )}
        {isCapturing && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white space-y-2">
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
              className="col-span-3 shadow-lg h-16 text-lg rounded-2xl" 
              onClick={captureAndScan} 
              disabled={!isLoaded || isCapturing}
            >
              <Camera className="mr-2" />
              촬영 및 분석
            </Button>
            <Button 
              variant="outline" 
              className="col-span-1 shadow-md h-16 border-primary-200 text-primary-700 bg-white rounded-2xl" 
              onClick={() => fileInputRef.current?.click()}
              disabled={!isLoaded || isCapturing}
            >
              <ImageIcon size={28} />
            </Button>
          </div>
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
              <Button variant="outline" className="rounded-2xl h-14" onClick={resetScanner}>다시 시도</Button>
              <Button variant="primary" className="rounded-2xl h-14 shadow-md">이 정보로 검색</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
