'use client';

import { useState } from 'react';
import Button from '@/components/ui/button/Button';
import Chip from '@/components/ui/chip/Chip';
import TasteSliderGroup from './TasteSliderGroup';

interface Step2TasteProps {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onNext: () => void;
  onPrev: () => void;
}

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
        
        {/* REFACTORED: 커스텀 취향 슬라이더 그룹 사용 */}
        <TasteSliderGroup 
          tastes={tastes} 
          onChange={handleTasteChange} 
        />

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
