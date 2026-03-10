'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Upload, ChevronLeft, Search, Star, X } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Input from '@/components/ui/input/Input';

type ScanStatus = 'idle' | 'scanning' | 'confirming' | 'result';

export default function ScanPage() {
  const [status, setStatus] = useState<ScanStatus>('idle');

  const startScan = () => {
    setStatus('scanning');
    setTimeout(() => setStatus('confirming'), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col no-scrollbar">
      {/* Header */}
      {status !== 'idle' && status !== 'scanning' && (
        <header className="flex items-center justify-between px-6 py-4 bg-background sticky top-0 z-20">
          <button onClick={() => setStatus(status === 'confirming' ? 'idle' : 'confirming')} className="p-2 -ml-2">
            {status === 'result' ? <X /> : <ChevronLeft />}
          </button>
          <h1 className="text-lg font-bold text-text-main">
            {status === 'confirming' ? '인식 정보 확인' : '스캔 검색 결과'}
          </h1>
          <div className="w-10" />
        </header>
      )}

      <main className="flex-1 px-6 py-6 flex flex-col overflow-y-auto no-scrollbar">
        {status === 'idle' && (
          <div className="flex flex-col flex-1">
            <h1 className="text-2xl font-black text-text-main mb-2">WINE SCAN</h1>
            <p className="text-sm text-text-main/40 font-medium mb-10">와인 라벨을 스캔하면 정보를 알려드려요</p>

            <div className="flex-1 border-2 border-dashed border-primary-500/30 rounded-[40px] flex flex-col items-center justify-center p-8 mb-8">
              <div className="w-32 h-32 bg-[#FFE5E5] rounded-full mb-8 flex items-center justify-center">
                <div className="w-8 h-20 bg-[#3D4B3D] rounded-full translate-x-2" />
                <div className="w-16 h-16 bg-[#7B4D9B] rounded-full -translate-x-2" />
              </div>
              <h2 className="text-xl font-black text-text-main mb-3">와인 라벨을 찍어보세요!</h2>
              <p className="text-sm text-text-main/40 text-center font-medium leading-relaxed px-4">
                카메라로 와인 라벨을 스캔하면 어떤 와인인지,<br />어떤 음식과 어울리는지 쉽게 알 수 있어요.
              </p>
            </div>

            <div className="flex gap-3 mb-12">
              <Button onClick={startScan} size="full" className="flex-1 gap-3 text-lg h-16">
                <Camera size={24} /> 카메라로 스캔
              </Button>
              <button className="w-16 h-16 bg-white border border-primary-100 rounded-3xl flex items-center justify-center text-text-main/30 hover:bg-gray-50 transition-colors">
                <Upload size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-black text-text-main italic">
                <span className="text-[#FF8A00]">⚡</span> 이렇게 스캔해 보세요
              </div>
              {[
                { n: 1, t: '와인 라벨이 잘 보이게 카메라를 맞춰주세요' },
                { n: 2, t: '글자가 선명하게 보이도록 가까이 찍어주세요' },
                { n: 3, t: '조명이 밝은 곳에서 스캔하면 더 정확해요' }
              ].map((tip) => (
                <div key={tip.n} className="bg-white p-4 rounded-full flex items-center gap-4 border border-primary-100">
                  <span className="w-8 h-8 rounded-full bg-[#FFE5E5] text-[#B36262] font-black flex items-center justify-center text-sm">{tip.n}</span>
                  <span className="text-sm font-bold text-text-main/60">{tip.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'scanning' && (
          <div className="flex flex-col flex-1 items-center justify-center text-center">
             <h1 className="text-2xl font-black text-text-main mb-2 absolute top-6 left-6">WINE SCAN</h1>
             <p className="text-sm text-text-main/40 font-medium mb-10 absolute top-[64px] left-6">와인 라벨을 스캔하면 정보를 알려드려요</p>
             
             <div className="w-full aspect-square border-2 border-dashed border-primary-500/30 rounded-[40px] flex flex-col items-center justify-center p-8 mb-8 relative">
                <div className="w-48 h-48 rounded-full border-[6px] border-[#FFE5E5] border-t-[#B36262] animate-spin mb-10" />
                <h2 className="text-2xl font-black text-text-main mb-3">라벨을 분석하고 있어요...</h2>
                <p className="text-lg text-text-main/40 font-bold">잠시만 기다려 주세요!</p>
             </div>
          </div>
        )}

        {status === 'confirming' && (
          <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
            <div className="w-full aspect-video bg-gray-100 rounded-[40px] relative overflow-hidden">
               {/* Preview Image Placeholder */}
               <button className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm text-[#B36262] font-bold px-5 py-2.5 rounded-2xl text-sm border border-primary-100 shadow-sm">
                 재촬영
               </button>
            </div>

            <div className="space-y-6">
              <Input label="와이너리 (제조사)" defaultValue="Chelti Winery" />
              <Input label="와인 이름" defaultValue="Saperavi Qvevri Family Collection" />
              <Input label="생산 연도 (Vintage)" defaultValue="2020" />
            </div>

            <Button onClick={() => setStatus('result')} size="full" className="text-lg h-16 shadow-lg">
              이 정보로 검색하기
            </Button>
          </div>
        )}

        {status === 'result' && (
          <div className="flex flex-col space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             {/* Main Result Card */}
             <div className="bg-white rounded-[40px] p-6 border border-primary-100 shadow-sm flex gap-5 items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-3xl shrink-0" />
                <div className="flex-1 space-y-1 relative">
                   <h3 className="font-black text-xl leading-tight">Chateau Margaux 2018</h3>
                   <p className="text-sm text-text-main/40 font-medium">Bordeaux Red</p>
                   <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1 text-[#FF8A00] font-black">
                        <Star size={16} fill="#FF8A00" /> 4.8
                      </div>
                      <span className="font-black text-lg text-[#B36262]">₩120,000</span>
                   </div>
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-black text-[#B36262]">
                      95%
                   </div>
                </div>
             </div>

             {/* Taste Profile */}
             <div className="space-y-4">
                <h4 className="text-lg font-black text-text-main italic">맛 프로필</h4>
                <div className="bg-white rounded-[40px] p-8 border border-primary-100 shadow-sm space-y-4">
                   {['BODY', 'SWEET', 'ACID', 'TANNIN'].map((label) => (
                      <div key={label} className="flex items-center justify-between">
                         <span className="text-xs font-black text-text-main/60">{label}</span>
                         <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((d) => (
                               <div key={d} className={`w-2.5 h-2.5 rotate-45 ${d <= 4 ? 'bg-[#B36262]' : 'bg-primary-100'}`} />
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Recommendation Banner */}
             <div className="bg-[#FFE5E5] rounded-[32px] p-6 flex items-center gap-4 border border-[#B36262]/10">
                <div className="w-12 h-12 bg-[#B36262]/30 rounded-full shrink-0" />
                <p className="text-sm font-bold text-text-main leading-relaxed">
                   이런 와인을 찾으셨군요! 비슷한 와인도 함께 추천해드릴게요!
                </p>
             </div>

             {/* Similar Wines */}
             <div className="space-y-4">
                <h4 className="text-lg font-black text-text-main italic">비슷한 와인 추천</h4>
                <div className="space-y-4">
                   {[1, 2].map((i) => (
                      <div key={i} className="bg-white p-5 rounded-[40px] border border-primary-100 shadow-sm flex gap-4 items-center">
                         <div className="w-16 h-16 bg-gray-100 rounded-2xl shrink-0" />
                         <div className="flex-1 space-y-0.5">
                            <h5 className="font-black text-base">Chateau Margaux 2018</h5>
                            <p className="text-xs text-text-main/40">Bordeaux Red</p>
                            <div className="flex items-center gap-3 pt-1">
                               <div className="flex items-center gap-1 text-[#FF8A00] font-black text-xs">
                                 <Star size={12} fill="#FF8A00" /> 4.8
                               </div>
                               <span className="font-black text-sm text-[#B36262]">₩120,000</span>
                            </div>
                         </div>
                         <div className="text-[10px] font-black text-[#B36262] bg-primary-100 px-2 py-1 rounded-md">95%</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
