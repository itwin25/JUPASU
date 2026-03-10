'use client';

import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { cn } from '@/lib/utils';

interface Step3WineReviewProps {
  onNext: () => void;
  onPrev: () => void;
}

const ALL_WINES = [
  { id: 1, name: '샤토 마고 2018', region: '보르도, 프랑스' },
  { id: 2, name: '오퍼스 원 2019', region: '나파밸리, 미국' },
  { id: 3, name: '모스카토 다스티', region: '피에몬테, 이탈리아' },
  { id: 4, name: '클라우디 베이', region: '말보로, 뉴질랜드' },
];

export default function Step3WineReview({ onNext, onPrev }: Step3WineReviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratings, setRatings] = useState<Record<number, number>>({});

  const filteredWines = ALL_WINES.filter(wine => 
    wine.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRate = (wineId: number, score: number) => {
    setRatings(prev => ({
      ...prev,
      [wineId]: prev[wineId] === score ? 0 : score
    }));
  };

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-right-8 duration-300">
      <h2 className="text-primary-700 font-bold">Step 3 - 시음 정보</h2>
      
      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">마셔본 와인에 대한 평가를 남겨주세요</h3>
          <p className="text-sm text-text-main/40 font-medium">입력한 정보는 나의 리뷰에 저장됩니다</p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/30 group-focus-within:text-primary-700 transition-colors" size={20} />
          <input
            className="w-full bg-white border-2 border-primary-100 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary-500 transition-all font-bold"
            placeholder="와인 이름으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Wine Cards (Filtered) */}
        <div className="space-y-3 min-h-[200px]">
          {filteredWines.length > 0 ? (
            filteredWines.map((wine) => (
              <div key={wine.id} className="bg-white border border-primary-100 rounded-3xl p-4 flex gap-4 items-center shadow-sm animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-primary-100/30 rounded-2xl shrink-0 flex items-center justify-center text-2xl">
                  🍷
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-md text-text-main">{wine.name}</h4>
                  <p className="text-xs text-text-main/40 font-bold">{wine.region}</p>
                  
                  {/* Interactive Stars with Soft Yellow Color */}
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (ratings[wine.id] || 0);
                      return (
                        <button
                          key={star}
                          onClick={() => handleRate(wine.id, star)}
                          className="transition-transform active:scale-125"
                        >
                          <Star 
                            size={20} 
                            className={cn(
                              "transition-colors",
                              isFilled ? "text-[#FDE047] fill-[#FDE047]" : "text-gray-200"
                            )} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-text-main/30 font-bold">
              검색 결과가 없어요.
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 space-y-4">
        <Button onClick={onNext} size="full" className="text-lg shadow-lg">완료</Button>
        <button onClick={onNext} className="w-full text-text-main/40 text-sm font-medium hover:text-text-main transition-colors">건너뛰기</button>
      </div>
    </div>
  );
}
