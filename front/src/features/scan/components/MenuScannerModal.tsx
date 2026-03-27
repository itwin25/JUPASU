'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import NextImage from 'next/image';
import { Camera, Plus, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Modal from '@/components/ui/modal/Modal';
import Button from '@/components/ui/button/Button';
import { useOCR } from '../hooks/useOCR';

interface MenuRefinedResult {
  wineNames?: string[];
  foodNames?: string[];
}

interface MenuScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete: (data: MenuRefinedResult) => void;
}

export default function MenuScannerModal({
  isOpen,
  onClose,
  onAnalysisComplete,
}: MenuScannerModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { executeOCR, isLoading: isAnalyzing, error: ocrError } = useOCR();

  // 이미지 압축 유틸리티 (최대 1600px, 0.7 퀄리티)
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1600;

        if (width > height && width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7,
        );
      };
      img.onerror = () => resolve(file);
    });
  };

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment' as const,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('카메라 접근에 실패했습니다.');
    }
  }, []);

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            setIsCapturing(true);
            try {
              const rawFile = new File([blob], `menu_${Date.now()}.jpg`, { type: 'image/jpeg' });
              const optimizedFile = await compressImage(rawFile);
              const url = URL.createObjectURL(optimizedFile);

              setImages((prev) => [...prev, optimizedFile]);
              setPreviews((prev) => [...prev, url]);
              stopCamera();
            } finally {
              setIsCapturing(false);
            }
          }
        },
        'image/jpeg',
        0.9,
      );
    }
  }, [stopCamera]);

  // 파일 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const optimizedFile = await compressImage(file);
      const url = URL.createObjectURL(optimizedFile);
      setImages((prev) => [...prev, optimizedFile]);
      setPreviews((prev) => [...prev, url]);
    } finally {
      setIsCapturing(false);
    }
  };

  // 이미지 삭제
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // 분석 시작
  const handleStartAnalysis = async () => {
    if (images.length === 0) return;

    try {
      const result = await executeOCR(images, 'MENU_SCAN');
      if (result.success && result.refined) {
        onAnalysisComplete(result.refined);
        onClose();
      } else {
        const errMsg =
          'error' in result && typeof result.error === 'string'
            ? result.error
            : '메뉴판 분석에 실패했습니다. Spring 서버와 AI 서버가 실행 중인지 확인해주세요.';
        alert(errMsg);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('메뉴판 분석 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 언마운트 시 카메라 스트림 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);

  // 카메라 스트림 연결
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="메뉴판 스캔"
      className="max-w-[26rem]"
      hideDefaultFooter
    >
      <div className="flex flex-col space-y-5">
        <p className="text-text-main/60 text-center text-sm font-medium">
          와인 메뉴판을 촬영하거나 업로드해주세요. (최대 5장)
        </p>

        {/* 메인 뷰: 카메라 혹은 이미지 목록 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
          {showCamera ? (
            <div className="h-full w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                <Button variant="secondary" size="sm" onClick={stopCamera}>
                  취소
                </Button>
                <Button variant="primary" size="sm" onClick={capturePhoto}>
                  촬영하기
                </Button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-white/40">
              <ImageIcon size={48} strokeWidth={1.5} />
              <p className="text-sm">메뉴판 사진이 없습니다.</p>
            </div>
          ) : (
            <div className="h-full w-full">
              <div className="relative h-full w-full">
                <NextImage
                  src={previews[previews.length - 1]}
                  alt="Latest"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="absolute top-3 right-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                {images.length} / 5
              </div>
            </div>
          )}

          {(isAnalyzing || isCapturing) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-black/60 text-white">
              <Loader2 className="text-primary-400 animate-spin" size={40} />
              <p className="text-[15px] font-bold">
                {isCapturing ? '이미지 최적화 중...' : '와인 목록 분석 중...'}
              </p>
            </div>
          )}
        </div>

        {/* 썸네일 목록 및 추가 버튼 */}
        <div className="flex gap-2 overflow-x-auto pt-2 pb-2">
          {previews.map((url, idx) => (
            <div key={url} className="relative h-16 w-16 shrink-0 rounded-lg bg-gray-100">
              <NextImage
                src={url}
                alt="Preview"
                fill
                unoptimized
                className="rounded-lg object-cover"
              />
              <button
                onClick={() => removeImage(idx)}
                className="bg-primary-700 absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-md active:scale-90"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {images.length < 5 && !showCamera && (
            <div className="flex gap-2">
              <button
                onClick={startCamera}
                className="border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed transition-colors active:scale-95"
              >
                <Camera size={20} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed transition-colors active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />

        <div className="pt-2">
          <Button
            variant="primary"
            size="full"
            className="h-14"
            disabled={images.length === 0 || isAnalyzing || isCapturing}
            onClick={handleStartAnalysis}
            isLoading={isAnalyzing}
          >
            {isAnalyzing ? '분석 중...' : `${images.length}장의 사진 분석 시작`}
          </Button>
          {ocrError && <p className="mt-2 text-center text-xs text-red-500">{ocrError}</p>}
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </Modal>
  );
}
