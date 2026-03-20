'use client';

import { useState } from 'react';
import { Search, Star, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Button from '@/components/ui/button/Button';
import Modal from '@/components/ui/modal/Modal';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useModal } from '@/hooks/useModal';
import { wineApi } from '@/features/wine/api/wine.api';
import { Wine } from '@/features/wine/types/wine.types';

interface Step3WineReviewProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3WineReview({ onNext, onPrev: _onPrev }: Step3WineReviewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const { isOpen, open, close } = useModal();
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['wines', 'search', debouncedSearchTerm],
    queryFn: () => wineApi.searchWines({ keyword: debouncedSearchTerm, size: 20 }),
    enabled: debouncedSearchTerm.length >= 1,
  });

  const handleRate = (wineId: number, score: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRatings((prev) => ({
      ...prev,
      [wineId]: prev[wineId] === score ? 0 : score,
    }));
  };

  const handleWineClick = (wine: Wine) => {
    setSelectedWine(wine);
    open();
  };

  const wines = data?.content || [];

  return (
    <div className="animate-in fade-in slide-in-from-right-8 space-y-7 duration-300">
      <h2 className="text-primary-700 font-bold">Step 3 - 시음 정보</h2>

      <div className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold">마셔본 와인에 대한 평가를 남겨주세요</h3>
          <p className="text-text-main/40 text-sm font-medium">
            입력한 정보는 나의 리뷰에 저장됩니다
          </p>
        </div>

        {/* Search Bar */}
        <div className="group relative">
          <Search
            className="text-text-main/30 group-focus-within:text-primary-700 absolute top-1/2 left-4 -translate-y-1/2 transition-colors"
            size={20}
          />
          <input
            className="border-primary-100 focus:border-primary-500 w-full rounded-2xl border-2 bg-white py-4 pr-4 pl-12 font-bold transition-all focus:outline-none"
            placeholder="와인 이름으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isLoading && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2">
              <Loader2 className="text-primary-500 animate-spin" size={20} />
            </div>
          )}
        </div>

        {/* Wine Cards (API Data) */}
        <div className="min-h-[200px] space-y-3">
          {wines.length > 0 ? (
            wines.map((wine) => (
              <div
                key={wine.id}
                onClick={() => handleWineClick(wine)}
                className="border-primary-100 animate-in zoom-in-95 hover:border-primary-300 flex cursor-pointer items-center gap-4 rounded-3xl border bg-white p-4 shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                <div className="bg-primary-100/30 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                  {wine.imageUrl ? (
                    <img
                      src={wine.imageUrl}
                      alt={wine.nameKr}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🍷</span>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-md text-text-main font-bold">{wine.nameKr}</h4>
                  <p className="text-text-main/40 text-xs font-bold">{wine.country}</p>

                  {/* Interactive Stars */}
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (ratings[wine.id] || 0);
                      return (
                        <button
                          key={star}
                          onClick={(e) => handleRate(wine.id, star, e)}
                          className="transition-transform active:scale-125"
                        >
                          <Star
                            size={20}
                            className={cn(
                              'transition-colors',
                              isFilled ? 'fill-[#FDE047] text-[#FDE047]' : 'text-gray-200',
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : searchTerm.length > 0 && !isLoading && debouncedSearchTerm === searchTerm ? (
            <div className="text-text-main/30 py-10 text-center font-bold">검색 결과가 없어요.</div>
          ) : (
            <div className="text-text-main/30 py-10 text-center font-bold">
              와인 이름을 검색해보세요!
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-8">
        <Button onClick={onNext} size="full" className="text-lg shadow-lg">
          완료
        </Button>
        <button
          onClick={onNext}
          className="text-text-main/40 hover:text-text-main w-full text-sm font-medium transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* Review Write Modal (Placeholder) */}
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="리뷰 작성"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" size="full" onClick={close}>
              취소
            </Button>
            <Button
              size="full"
              onClick={() => {
                // TODO: 리뷰 저장 로직 구현
                close();
              }}
            >
              저장
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary-100/30 flex h-16 w-16 shrink-0 items-center justify-center rounded-xl">
              {selectedWine?.imageUrl ? (
                <img
                  src={selectedWine.imageUrl}
                  alt={selectedWine.nameKr}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-xl">🍷</span>
              )}
            </div>
            <div>
              <h4 className="text-text-main font-bold">{selectedWine?.nameKr}</h4>
              <p className="text-text-main/40 text-xs font-bold">{selectedWine?.nameEn}</p>
            </div>
          </div>
          <div className="bg-primary-100/20 rounded-2xl p-4 text-center">
            <p className="text-primary-800 text-sm font-bold">
              이곳에 리뷰 작성 UI가 들어올 예정입니다.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
