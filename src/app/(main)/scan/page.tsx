'use client';

import { useState, useRef, useCallback } from 'react';
import NextImage from 'next/image';
import { Camera, ChevronLeft, Star, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';
import { useOCR } from '@/features/scan/hooks/useOCR';
import { useEffect } from 'react';
import { OCRResult } from '@/features/scan/types';

type ScanStatus = 'idle' | 'scanning' | 'confirming' | 'result';

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);
  const [scanData, setScanData] = useState({
    winery: '',
    wineName: '',
    vintage: '',
  });

  // 디버깅: 데이터 변경 감시
  useEffect(() => {
    if (status === 'confirming') {
      console.log('🔍 [Debug] Current OCR Results:', ocrResults);
      console.log('🔍 [Debug] Current Image Info:', imageInfo);
    }
  }, [status, ocrResults, imageInfo]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // 서버 OCR을 사용하도록 훅에서 추출
  const { executeOCR, error: modelError } = useOCR();

  // 이미지 분석 및 데이터 매핑 (서버 연산 사용)
  const handleImageAnalysis = useCallback(
    async (imageFile: File) => {
      setStatus('scanning');

      try {
        // 1. 이미지 로드 및 프리뷰 생성
        const reader = new FileReader();
        const imageLoadPromise = new Promise<void>((resolve) => {
          reader.onload = (e) => {
            setCapturedImage(e.target?.result as string);
            resolve();
          };
          reader.readAsDataURL(imageFile);
        });

        await imageLoadPromise;

        // 2. 서버 OCR 실행 (useOCR 훅 사용)
        const result = await executeOCR(imageFile);

        console.log('✅ 서버 분석 결과:', result);

        // 3. 데이터 저장 및 매핑
        if (result.success) {
          setOcrResults(result.results || []);
          setImageInfo(result.imageInfo || null);

          if (result.refined) {
            setScanData({
              winery: result.refined.winery || '',
              wineName: result.refined.wineName || '',
              vintage: result.refined.vintage || '',
            });
          }
        }

        setStatus('confirming');
      } catch (err) {
        console.error('OCR Error:', err);
        alert('이미지 분석에 실패했습니다. 다시 시도해주세요.');
        setStatus('idle');
      }
    },
    [executeOCR],
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
          <p className="font-bold text-red-500">OCR 서비스 연결 실패</p>
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
          <div className="flex flex-col py-2">
            <header className="mb-2">
              <h1 className="text-text-main mb-1 text-2xl font-black">WINE SCAN</h1>
              <p className="text-text-main/40 text-sm font-medium">
                와인 라벨을 스캔하면 정보를 알려드려요
              </p>
            </header>

            <div className="relative mx-auto mt-4 mb-4 aspect-square w-full overflow-hidden rounded-[40px]">
              <NextImage
                src="/Scanning.jpg"
                alt="Scanning Guide"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-text-main mb-3 flex items-center gap-2 text-base font-black italic">
                  <span className="text-lg text-[#FF8A00]">⚡</span> 이렇게 스캔해 보세요
                </div>
                <div className="mb-6 space-y-3">
                  {[
                    { n: 1, t: '라벨이 정면에서 잘 보이게 촬영해주세요' },
                    { n: 2, t: '글자가 선명하게 보이도록 가까이 찍어주세요' },
                    { n: 3, t: '조명이 밝은 곳에서 스캔하면 더 정확해요' },
                  ].map((tip) => (
                    <div
                      key={tip.n}
                      className="border-primary-100 flex items-center gap-4 rounded-full border bg-white px-5 py-2 shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFE5E5] text-sm font-black text-[#B36262]">
                        {tip.n}
                      </span>
                      <span className="text-text-main/60 text-sm font-bold">{tip.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={triggerUpload}
                size="full"
                className="h-16 gap-3 rounded-3xl text-lg shadow-xl"
              >
                <Camera size={24} />
                와인 라벨 스캔하기
              </Button>
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
          <div className="animate-in fade-in flex flex-col py-2 duration-500">
            <div className="border-primary-100 relative aspect-square w-full overflow-hidden rounded-[40px] border bg-gray-100 shadow-inner">
              {capturedImage && (
                <div className="relative h-full w-full">
                  <NextImage src={capturedImage} alt="Preview" fill className="object-contain" />
                  {/* 바운딩 박스 레이어 */}
                  {ocrResults.length > 0 && (
                    <svg
                      className="pointer-events-none absolute top-0 left-0 z-50 h-full w-full"
                      viewBox={`0 0 ${imageInfo?.width || 1080} ${imageInfo?.height || 1080}`}
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {ocrResults.map((res, i) => {
                        const box = res.box;
                        if (!box) return null;

                        let x = 0;
                        let y = 0;
                        let boxElement = null;

                        // 1. 객체 형식 대응 { x, y, width, height }
                        if (
                          typeof box === 'object' &&
                          !Array.isArray(box) &&
                          box !== null &&
                          'x' in box
                        ) {
                          const b = box as { x: number; y: number; width: number; height: number };
                          x = b.x;
                          y = b.y;
                          boxElement = (
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.width}
                              height={b.height}
                              style={{
                                fill: 'rgba(0, 255, 0, 0.1)',
                                stroke: '#00FF00',
                                strokeWidth: '2px',
                                vectorEffect: 'non-scaling-stroke',
                              }}
                            />
                          );
                        }
                        // 2. 배열 형식 대응 [[x,y], ...] 또는 [x,y,x,y]
                        else if (Array.isArray(box) && box.length > 0) {
                          let pointsString = '';
                          if (Array.isArray(box[0])) {
                            const pts = box as number[][];
                            x = pts[0][0];
                            y = pts[0][1];
                            pointsString = pts.map((p) => `${p[0]},${p[1]}`).join(' ');
                          } else {
                            const pts = box as number[];
                            x = pts[0];
                            y = pts[1];
                            for (let j = 0; j < pts.length; j += 2) {
                              pointsString += `${pts[j]},${pts[j + 1]} `;
                            }
                          }
                          boxElement = (
                            <polygon
                              points={pointsString.trim()}
                              style={{
                                fill: 'rgba(0, 255, 0, 0.1)',
                                stroke: '#00FF00',
                                strokeWidth: '2px',
                                vectorEffect: 'non-scaling-stroke',
                              }}
                            />
                          );
                        }

                        if (!boxElement) return null;

                        return (
                          <g key={i}>
                            {boxElement}
                            {res.text && (
                              <text
                                x={x}
                                y={y - 2} // 간격도 살짝 줄임
                                style={{
                                  fill: '#00FF00',
                                  fontSize: `${Math.max((imageInfo?.width || 1080) * 0.02, 8)}px`,
                                  fontWeight: 'bold',
                                  paintOrder: 'stroke',
                                  stroke: '#000000',
                                  strokeWidth: '1px', // 외곽선 두께 축소
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                }}
                              >
                                {res.text}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              )}
              <button
                onClick={triggerUpload}
                className="border-primary-100 absolute right-4 bottom-4 rounded-2xl border bg-white/80 px-5 py-2.5 text-sm font-bold text-[#B36262] shadow-sm backdrop-blur-sm"
              >
                다시 찍기
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Input
                label="와이너리 (제조사)"
                value={scanData.winery}
                placeholder="제조사 이름을 입력해 주세요 (예: Montes)"
                onChange={(e) => setScanData({ ...scanData, winery: e.target.value })}
              />
              <Input
                label="와인 이름"
                value={scanData.wineName}
                placeholder="와인 이름을 입력해 주세요 (예: Alpha)"
                onChange={(e) => setScanData({ ...scanData, wineName: e.target.value })}
              />
              <Input
                label="생산 연도 (Vintage)"
                value={scanData.vintage}
                placeholder="생산 연도를 입력해 주세요 (예: 2021)"
                onChange={(e) => setScanData({ ...scanData, vintage: e.target.value })}
              />
            </div>

            <div className="mt-6">
              <Button
                onClick={() => setStatus('result')}
                size="full"
                className="h-14 text-lg shadow-lg"
              >
                이 정보로 검색하기
              </Button>
            </div>
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
                <h4 className="text-text-main/40 text-sm font-medium">{scanData.winery}</h4>
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

            {/* Taste Profile (Mockup) */}
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
