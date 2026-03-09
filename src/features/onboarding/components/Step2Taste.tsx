'use client';

import Button from '@/components/ui/button/Button';
import Chip from '@/components/ui/chip/Chip';

interface Step2TasteProps {
  onNext: () => void;
  onPrev: () => void;
}

const TASTE_FACTORS = ['당도', '상큼함', '무게감', '타닌', '향'];
const SITUATIONS = ['선물', '혼술', '파티', '데이트', '가족모임'];

export default function Step2Taste({ onNext, onPrev }: Step2TasteProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-primary-700 font-bold">Step 2 - 취향 정보</h2>
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold">어떤 스타일을 좋아하시나요?</h3>
        
        {/* Taste Sliders */}
        <div className="space-y-8">
          {TASTE_FACTORS.map((factor) => (
            <div key={factor} className="space-y-3">
              <span className="text-sm text-text-main/50">{factor}</span>
              <div className="relative h-1 bg-primary-100 rounded-full flex justify-between px-1 items-center">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((dot) => (
                  <div key={dot} className={`w-1.5 h-1.5 rounded-full ${dot === 5 ? 'w-4 h-4 bg-primary-700 -translate-y-[0px]' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Price Range */}
        <div className="space-y-3 pt-4">
          <span className="text-base font-bold">선호 가격대</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-4 text-center">5</div>
            <span>~</span>
            <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-4 text-center">15</div>
            <span className="text-text-main/50">만원</span>
          </div>
        </div>

        {/* Situations */}
        <div className="space-y-3 pt-4">
          <span className="text-base font-bold">주요 음용 상황 선택하기</span>
          <div className="flex flex-wrap gap-2">
            {SITUATIONS.map((s) => (
              <Chip key={s} variant="secondary" className="px-5">{s}</Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 space-y-4">
        <Button onClick={onNext} size="full" className="text-lg">다음</Button>
        <button onClick={onNext} className="w-full text-text-main/40 text-sm font-medium">건너뛰기</button>
      </div>
    </div>
  );
}
