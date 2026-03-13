'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import { Camera, ChevronLeft, Star, X, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import { useOCR } from '@/features/scan/hooks/useOCR';

type ScanStatus = 'idle' | 'scanning' | 'confirming' | 'result';

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanData, setScanData] = useState({
    winery: '',
    wineName: '',
    vintage: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isLoaded, initOCR, executeOCR, error: modelError } = useOCR();

  // OCR 엔진 초기화
  useEffect(() => {
    initOCR();
  }, [initOCR]);

  // 이미지 분석 및 데이터 매핑
  const handleImageAnalysis = useCallback(
    async (imageFile: File) => {
      if (!isLoaded) return;

      setStatus('scanning');

      try {
        // 1. 이미지 로드 및 프리뷰 생성
        const reader = new FileReader();
        const imageLoadPromise = new Promise<HTMLImageElement>((resolve) => {
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target?.result as string;
            setCapturedImage(e.target?.result as string);
          };
          reader.readAsDataURL(imageFile);
        });

        const img = await imageLoadPromise;

        // 2. OCR 실행
        await executeOCR(img);

        // 3. 데이터 매핑 제거 (사용자가 직접 입력하거나 추후 다른 방식으로 처리)
        setScanData({
          winery: '',
          wineName: '',
          vintage: '',
        });

        setStatus('confirming');
      } catch (err) {
        console.error('OCR Error:', err);
        alert('이미지 분석에 실패했습니다. 다시 시도해주세요.');
        setStatus('idle');
      }
    },
    [isLoaded, executeOCR],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageAnalysis(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (modelError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="font-bold text-red-500">OCR 엔진 로드 실패</p>
          <p className="text-text-main/60 text-sm">{modelError}</p>
          <Button onClick={() => window.location.reload()}>새로고침</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background no-scrollbar flex min-h-screen flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Header */}
      {status !== 'idle' && status !== 'scanning' && (
        <header className="bg-background sticky top-0 z-20 flex items-center justify-between px-6 py-4">
          <button onClick={() => setStatus('idle')} className="-ml-2 p-2">
            {status === 'result' ? <X /> : <ChevronLeft />}
          </button>
          <h1 className="text-text-main text-lg font-bold">
            {status === 'confirming' ? '인식 정보 확인' : '스캔 검색 결과'}
          </h1>
          <div className="w-10" />
        </header>
      )}

      <main className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-6">
        {status === 'idle' && (
          <div className="flex flex-1 flex-col py-2">
            <header className="mb-2">
              <h1 className="text-text-main mb-1 text-2xl font-black">WINE SCAN</h1>
              <p className="text-text-main/40 text-sm font-medium">
                와인 라벨을 스캔하면 정보를 알려드려요
              </p>
            </header>

            <div className="flex flex-1 flex-col">
              <div className="relative mx-auto mt-16 mb-4 aspect-square w-[80%] overflow-hidden rounded-[40px]">
                <NextImage
                  src="/Scanning.jpg"
                  alt="Scanning Guide"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              <div className="space-y-6">
                <div className="text-text-main mb-3 flex items-center gap-2 text-base font-black italic">
                  <span className="text-lg text-[#FF8A00]">⚡</span> 이렇게 스캔해 보세요
                </div>
                <div className="mb-10 space-y-4">
                  {[
                    { n: 1, t: '라벨이 정면에서 잘 보이게 촬영해주세요' },
                    { n: 2, t: '글자가 선명하게 보이도록 가까이 찍어주세요' },
                    { n: 3, t: '조명이 밝은 곳에서 스캔하면 더 정확해요' },
                  ].map((tip) => (
                    <div
                      key={tip.n}
                      className="border-primary-100 flex items-center gap-4 rounded-full border bg-white px-5 py-3 shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFE5E5] text-sm font-black text-[#B36262]">
                        {tip.n}
                      </span>
                      <span className="text-text-main/60 text-sm font-bold">{tip.t}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={triggerUpload}
                  disabled={!isLoaded}
                  size="full"
                  className="h-16 gap-3 rounded-3xl text-lg shadow-xl"
                >
                  {!isLoaded ? <RefreshCw className="animate-spin" /> : <Camera size={24} />}
                  {isLoaded ? '와인 라벨 스캔하기' : '엔진 준비 중...'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === 'scanning' && (
          <div className="animate-in fade-in flex flex-1 flex-col items-center justify-center py-6 text-center duration-500">
            <div className="border-primary-500/30 relative mb-8 flex aspect-square w-full flex-col items-center justify-center rounded-[40px] border-2 border-dashed bg-white p-8">
              <div className="mb-10 h-48 w-48 animate-spin rounded-full border-[6px] border-[#FFE5E5] border-t-[#B36262]" />
              <h2 className="text-text-main mb-3 text-2xl font-black">라벨을 분석하고 있어요...</h2>
              <p className="text-text-main/40 text-lg font-bold">잠시만 기다려 주세요!</p>
            </div>
          </div>
        )}

        {status === 'confirming' && (
          <div className="animate-in fade-in flex flex-col space-y-8 py-6 duration-500">
            <div className="border-primary-100 relative aspect-video w-full overflow-hidden rounded-[40px] border bg-gray-100 shadow-inner">
              {capturedImage && (
                <NextImage src={capturedImage} alt="Preview" fill className="object-cover" />
              )}
              <button
                onClick={triggerUpload}
                className="border-primary-100 absolute right-4 bottom-4 rounded-2xl border bg-white/80 px-5 py-2.5 text-sm font-bold text-[#B36262] shadow-sm backdrop-blur-sm"
              >
                다시 찍기
              </button>
            </div>

            <div className="space-y-6">
              <Input
                label="와이너리 (제조사)"
                value={scanData.winery}
                onChange={(e) => setScanData({ ...scanData, winery: e.target.value })}
              />
              <Input
                label="와인 이름"
                value={scanData.wineName}
                onChange={(e) => setScanData({ ...scanData, wineName: e.target.value })}
              />
              <Input
                label="생산 연도 (Vintage)"
                value={scanData.vintage}
                onChange={(e) => setScanData({ ...scanData, vintage: e.target.value })}
              />
            </div>

            <Button
              onClick={() => setStatus('result')}
              size="full"
              className="h-16 text-lg shadow-lg"
            >
              이 정보로 검색하기
            </Button>
          </div>
        )}

        {status === 'result' && (
          <div className="animate-in slide-in-from-bottom-4 flex flex-col space-y-8 py-6 duration-500">
            {/* Main Result Card */}
            <div className="border-primary-100 flex items-center gap-5 rounded-[40px] border bg-white p-6 shadow-sm">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-gray-100">
                {capturedImage && (
                  <NextImage src={capturedImage} alt="Wine" fill className="object-cover" />
                )}
              </div>
              <div className="relative flex-1 space-y-1">
                <h3 className="text-xl leading-tight font-black">
                  {scanData.wineName || '분석된 와인'}
                </h3>
                <p className="text-text-main/40 text-sm font-medium">{scanData.winery}</p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1 font-black text-[#FF8A00]">
                    <Star size={16} fill="#FF8A00" /> 4.8
                  </div>
                  <span className="text-lg font-black text-[#B36262]">₩120,000</span>
                </div>
                <div className="bg-primary-100 absolute top-1/2 right-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-black text-[#B36262]">
                  95%
                </div>
              </div>
            </div>

            {/* Taste Profile (Mockup for now) */}
            <div className="space-y-4">
              <h4 className="text-text-main text-lg font-black italic">맛 프로필</h4>
              <div className="border-primary-100 space-y-4 rounded-[40px] border bg-white p-8 shadow-sm">
                {['BODY', 'SWEET', 'ACID', 'TANNIN'].map((label) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-text-main/60 text-xs font-black">{label}</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((d) => (
                        <div
                          key={d}
                          className={`h-2.5 w-2.5 rotate-45 ${d <= 4 ? 'bg-[#B36262]' : 'bg-primary-100'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[32px] border border-[#B36262]/10 bg-[#FFE5E5] p-6">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#B36262]/30" />
              <p className="text-text-main text-sm leading-relaxed font-bold">
                이런 와인을 찾으셨군요! 비슷한 와인도 함께 추천해드릴게요!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
