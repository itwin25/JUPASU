'use client';

import { Search, Star } from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface Step3WineReviewProps {
  onNext: () => void;
  onPrev: () => void;
}

const SAMPLE_WINES = [
  { id: 1, name: '샤토 마고 2018', region: '보르도, 프랑스' },
  { id: 2, name: '오퍼스 원 2019', region: '나파밸리, 미국' },
];

export default function Step3WineReview({ onNext, onPrev }: Step3WineReviewProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-primary-700 font-bold">Step 3 - 시음 정보</h2>
      
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">마셔본 와인에 대한 평가를 남겨주세요</h3>
          <p className="text-sm text-text-main/40 font-medium">입력한 정보는 나의 리뷰에 저장됩니다</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/30" size={20} />
          <input
            className="w-full bg-white border-2 border-primary-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="와인 이름으로 검색"
          />
        </div>

        {/* Wine Cards */}
        <div className="space-y-4">
          {SAMPLE_WINES.map((wine) => (
            <div key={wine.id} className="bg-white border-2 border-primary-100 rounded-3xl p-5 flex gap-4 items-center shadow-sm">
              <div className="w-20 h-20 bg-primary-100/30 rounded-2xl shrink-0" />
              <div className="space-y-1">
                <h4 className="font-bold text-lg">{wine.name}</h4>
                <p className="text-sm text-text-main/40">{wine.region}</p>
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={18} className="text-gray-200" fill="#EBE6DF" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 space-y-4">
        <Button onClick={onNext} size="full" className="text-lg">완료</Button>
        <button onClick={onNext} className="w-full text-text-main/40 text-sm font-medium">건너뛰기</button>
      </div>
    </div>
  );
}
