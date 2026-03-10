'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import Chip from '@/components/ui/chip/Chip';

const TASTE_FACTORS = ['당도', '상큼함', '무게감', '타닌', '향'];
const WINE_TYPES = [
  { label: '레드', emoji: '🍷' },
  { label: '화이트', emoji: '🥂' },
  { label: '로제', emoji: '🍇' },
  { label: '스파클링', emoji: '✨' },
];
const FLAVORS = ['과일향', '꽃향', '베리류'];
const SITUATIONS = ['선물', '혼술', '집들이', '데이트', '가족모임'];

export default function TasteEditPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-12">
      <header className="flex items-center px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Link href="/mypage" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
        <h1 className="flex-1 text-center font-black text-text-main mr-10">취향 정보 수정</h1>
      </header>

      <main className="px-6 space-y-12">
        <div className="space-y-8">
           <h3 className="text-base font-black text-text-main italic uppercase">와인 취향 설정 (WINE-T)</h3>
           <div className="space-y-8">
              {TASTE_FACTORS.map((factor) => (
                <div key={factor} className="space-y-3">
                  <span className="text-sm font-bold text-text-main/30">{factor}</span>
                  <div className="relative h-1 bg-primary-100 rounded-full flex justify-between px-1 items-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
                      <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot === 5 ? 'w-4 h-4 bg-[#B36262] border-4 border-white shadow-sm' : 'bg-gray-300'}`} />
                    ))}
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-base font-black text-text-main italic">선호 와인 종류</h3>
           <p className="text-xs font-bold text-text-main/30 -mt-2">좋아하는 와인 종류를 선택해주세요</p>
           <div className="grid grid-cols-2 gap-3">
              {WINE_TYPES.map((type, i) => (
                <button key={type.label} className={cn(
                  "bg-white rounded-[32px] py-6 flex items-center justify-center gap-3 border-2 transition-all font-black text-lg",
                  i < 2 ? "border-[#B36262]/30 text-text-main" : "border-primary-100 text-text-main/40"
                )}>
                  <span>{type.emoji}</span> {type.label}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-base font-black text-text-main italic">좋아하는 맛/향</h3>
           <p className="text-xs font-bold text-text-main/30 -mt-2">AI 추천에 반영됩니다</p>
           <div className="flex flex-wrap gap-2">
              {['과일향', '꽃향', '베리류'].map((f, i) => (
                <Chip key={f} active={i !== 1} variant={i !== 1 ? 'primary' : 'secondary'} className="px-6 bg-[#D95F63]/10 text-[#D95F63] border-[#D95F63]/20">
                  {f}
                </Chip>
              ))}
              {[1, 2, 3, 4].map(n => <div key={n} className="w-16 h-8 bg-primary-100/30 rounded-full" />)}
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-base font-black text-text-main italic">주요 음용 상황 선택하기</h3>
           <div className="flex flex-wrap gap-2">
              {SITUATIONS.map((s, i) => (
                <Chip key={s} active={i === 2} variant={i === 2 ? 'primary' : 'secondary'} className="px-6">
                  {s}
                </Chip>
              ))}
           </div>
        </div>

        <Button size="full" className="h-16 text-lg font-black bg-[#B36262] text-white rounded-[32px] shadow-lg mt-8">
          변경사항 저장
        </Button>
      </main>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
