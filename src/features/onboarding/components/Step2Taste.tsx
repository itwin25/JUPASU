'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Chip from '@/components/ui/chip/Chip';
import { cn } from '@/lib/utils';

interface Step2TasteProps {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onPrev: () => void;
}

const TASTE_FACTORS = [
  { label: '당도', key: 'sweet' },
  { label: '상큼함', key: 'acid' },
  { label: '무게감', key: 'body' },
  { label: '타닌', key: 'tannin' },
  { label: '향', key: 'aroma' },
];
const SITUATIONS = ['선물', '혼술', '파티', '데이트', '가족모임'];

export default function Step2Taste({ data, setData, onNext, onPrev }: Step2TasteProps) {
  const { tastes, selectedSituations } = data;

  const handleTasteChange = (key: string, value: number) => {
    setData((prev: any) => ({
      ...prev,
      tastes: { ...prev.tastes, [key]: value }
    }));
  };

  const toggleSituation = (s: string) => {
    setData((prev: any) => ({
      ...prev,
      selectedSituations: prev.selectedSituations.includes(s)
        ? prev.selectedSituations.filter((item: string) => item !== s)
        : [...prev.selectedSituations, s]
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300 w-full max-w-full overflow-x-hidden pb-10">
      <h2 className="text-primary-700 font-black text-sm uppercase tracking-widest">Step 2 - 취향 정보</h2>
      
      <div className="space-y-10">
        <h3 className="text-xl font-bold">어떤 스타일을 좋아하시나요?</h3>
        
        {/* Taste Sliders (Interactive Drag & Drop) */}
        <div className="space-y-10">
          {TASTE_FACTORS.map((factor) => (
            <div key={factor.key} className="space-y-4">
              <div className="flex justify-between items-center text-sm text-text-main/60 font-bold">
                <span>{factor.label}</span>
              </div>
              
              <div className="relative h-7 flex items-center group">
                {/* 1. Background Dots Layer (Visual Only) */}
                <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
                  <div className="absolute left-0 right-0 h-[2px] bg-primary-100 mx-1" />
                  <div className="flex justify-between w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                      <div 
                        key={s} 
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                          tastes[factor.key] === s ? "bg-transparent" : "bg-primary-100"
                        )} 
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Range Input Layer (The Engine) */}
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={tastes[factor.key]}
                  onChange={(e) => handleTasteChange(factor.key, Number(e.target.value))}
                  className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer z-20
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-[#B36262]
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:border-3
                    [&::-webkit-slider-thumb]:border-white
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:active:scale-125
                    
                    [&::-moz-range-thumb]:w-7
                    [&::-moz-range-thumb]:h-7
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-[#B36262]
                    [&::-moz-range-thumb]:border-4
                    [&::-moz-range-thumb]:border-white
                    [&::-moz-range-thumb]:shadow-lg
                  "
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-text-main/30 font-black px-1 uppercase tracking-tighter">
                <span>낮음</span>
                <span className="text-[#B36262] font-black scale-110">LV.{tastes[factor.key]}</span>
                <span>높음</span>
              </div>
            </div>
          ))}
        </div>

        {/* Price Range */}
        <div className="space-y-3 pt-2">
          <span className="text-base font-bold">선호 가격대</span>
          <div className="flex items-center gap-3">
            <input 
              type="number"
              className="w-30 bg-white border-2 border-primary-100 rounded-2xl p-2.5 text-center font-bold outline-none focus:border-[#B36262] transition-colors text-sm"
              placeholder="0" 
            />
            <span className="text-text-main/30 font-bold">~</span>
            <input 
              type="number"
              className="w-30 bg-white border-2 border-primary-100 rounded-2xl p-2.5 text-center font-bold outline-none focus:border-[#B36262] transition-colors text-sm"
              placeholder="20" 
            />
            <span className="text-sm font-bold text-text-main/50">만원</span>
          </div>
        </div>

        {/* Situations */}
        <div className="space-y-3 pt-2">
          <span className="text-base font-bold">주요 음용 상황 선택하기</span>
          <div className="flex flex-wrap gap-2">
            {SITUATIONS.map((s) => (
              <Chip 
                key={s} 
                variant="secondary" 
                className="px-5"
                active={selectedSituations.includes(s)}
                onClick={() => toggleSituation(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-4">
        <Button onClick={onNext} size="full" className="text-lg shadow-lg">다음</Button>
        <button onClick={onNext} className="w-full text-text-main/40 text-sm font-medium hover:text-text-main transition-colors">건너뛰기</button>
      </div>
    </div>
  );
}
