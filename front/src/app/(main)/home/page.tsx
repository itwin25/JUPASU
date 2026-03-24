'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Chip from '@/components/ui/chip/Chip';
import { useWineQuickRecommendQuery } from '@/features/wine/hooks/useWineListQuery';
import { DrinkingSituation } from '@/features/wine/types/wine.types';
import { ChevronRight } from 'lucide-react';

const DEFAULT_WINE_IMAGE_URL = '/default_wine.png';

const SITUATION_MAP: Record<string, DrinkingSituation> = {
  혼술: 'ALONE',
  기념일: 'DATE',
  파티: 'PARTY',
};

const SITUATIONS = ['혼술', '기념일', '파티'];

// 다이아몬드 게이지 표시 컴포넌트
function TasteGauge({ label, value }: { label: string; value: number | undefined | null }) {
  // 백엔드 데이터가 0.0 ~ 5.0 범위이므로 Math.ceil을 사용하여 1칸부터 채워지도록 함 (0이면 0칸)
  const displayValue = value ? Math.ceil(value) : 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-main/40 text-[10px] font-black tracking-tighter uppercase">
        {label}
      </span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 w-1.5 rotate-45 ${
              level <= displayValue ? 'bg-[#B36262]' : 'bg-primary-100'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const formatPriceTag = (price: number | undefined | null): string | null => {
  if (price === null || price === undefined || price === 0) return null;
  if (price <= 50000) return '5만원 이하';
  if (price <= 100000) return '10만원 이하';
  if (price <= 200000) return '20만원 이하';
  if (price <= 300000) return '30만원 이하';
  if (price <= 400000) return '40만원 이하';
  if (price <= 500000) return '50만원 이하';
  if (price >= 2000000) return '200만원 이상';

  // 50만원 단위 (100만원 이하, 150만원 이하, 200만원 이하)
  const units = Math.ceil(price / 500000) * 50;
  return `${units}만원 이하`;
};

const formatPrice = (price: number | undefined | null): string => {
  if (price === null || price === undefined || price === 0) return '가격 정보 없음';
  return `₩${price.toLocaleString()}`;
};

function WineImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_WINE_IMAGE_URL);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(DEFAULT_WINE_IMAGE_URL)}
    />
  );
}

export default function HomePage() {
  const [activeSituation, setActiveSituation] = useState('혼술');
  const { data: recommendations, isLoading } = useWineQuickRecommendQuery();

  // 'VIBE GALLERY'용 일반 추천 리스트
  const generalWines = recommendations?.general || [];

  // 상황별 추천 리스트 (현재 선택된 상황에 맞는 데이터 추출)
  const currentSituationEnum = SITUATION_MAP[activeSituation];
  const situationResult = recommendations?.bySituation.find(
    (s) => s.situation === currentSituationEnum,
  );
  const situationWines = situationResult?.recommendations || [];

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#B36262]"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-28">
      <div className="bg-background/88 sticky top-0 z-30 px-6 pt-4 pb-3 backdrop-blur-xl">
        <div className="flex justify-center">
          <div className="relative h-14 w-14">
            <Image src="/logo.png" alt="JUPASU" fill className="object-contain" />
          </div>
        </div>
      </div>

      <section className="px-6 pt-4 pb-6">
        <h2 className="text-text-main mb-4 text-xl font-black tracking-tight uppercase italic">
          VIBE GALLERY
        </h2>

        <div className="no-scrollbar flex gap-4 overflow-x-auto px-1 pb-4">
          {generalWines.length > 0 ? (
            generalWines.map((wine) => (
              <Link key={wine.wineId} href={`/wines/${wine.wineId}`} className="shrink-0">
                <article className="border-primary-100 relative w-[232px] overflow-hidden rounded-[22px] border bg-white shadow-[0_12px_26px_rgba(51,34,17,0.06)] transition-all active:scale-[0.985]">
                  <div className="absolute top-4 left-4 z-10 rounded-full bg-[#B36262] px-3.5 py-1.5 text-[11px] font-black text-white shadow-sm">
                    {wine.matchRate}% MATCH
                  </div>

                  <div className="flex aspect-[0.92] items-center justify-center bg-[#FCFBF8] p-6">
                    <WineImage
                      src={wine.imageUrl}
                      alt={wine.nameKr}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 space-y-3 p-5">
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="text-text-main truncate text-[1rem] leading-tight font-black">
                        {wine.nameKr}
                      </h3>
                      <p className="truncate text-[11px] font-bold text-[#FF8A00]">
                        {[
                          formatPriceTag(wine.price) ? `#${formatPriceTag(wine.price)}` : null,
                          ...(wine.pairingFoods || []).map((food) => `#${food}`),
                        ]
                          .filter(Boolean)
                          .join(' ') || '당신을 위한 추천 와인'}
                      </p>
                    </div>

                    <div className="border-primary-100/50 space-y-1 border-t pt-1">
                      {wine.sweetness != null && (
                        <TasteGauge label="SWEET" value={wine.sweetness} />
                      )}
                      {wine.acidity != null && <TasteGauge label="ACID" value={wine.acidity} />}
                      {wine.body != null && <TasteGauge label="BODY" value={wine.body} />}
                      {wine.tannin != null && <TasteGauge label="TANNIN" value={wine.tannin} />}
                    </div>
                  </div>
                </article>
              </Link>
            ))
          ) : (
            <div className="text-text-main/40 w-full py-10 text-center font-bold">
              추천 와인이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-3">
        <h2 className="text-text-main mb-4 text-xl font-black tracking-tight italic">
          형선&apos;S PICK!
        </h2>

        <div className="no-scrollbar mb-4 flex gap-3 overflow-x-auto pb-1">
          {SITUATIONS.map((category) => (
            <Chip
              key={category}
              active={activeSituation === category}
              variant={activeSituation === category ? 'primary' : 'secondary'}
              className="px-6 py-2 text-xs font-black transition-all"
              onClick={() => setActiveSituation(category)}
            >
              {category}
            </Chip>
          ))}
        </div>

        <div className="space-y-2">
          {situationWines.length > 0 ? (
            situationWines.map((wine) => (
              <Link key={wine.wineId} href={`/wines/${wine.wineId}`} className="block">
                <article className="border-[#F1E9E0] flex min-h-[6.5rem] items-center gap-3 rounded-[22px] border bg-white px-3.5 py-2.5 shadow-[0_10px_24px_rgba(51,34,17,0.05)] transition-all active:scale-[0.985]">
                  <div className="flex h-[4.8rem] w-[4.8rem] shrink-0 items-center justify-center rounded-[1.1rem] bg-[#F5F3F1] p-2">
                    <WineImage
                      src={wine.imageUrl}
                      alt={wine.nameKr}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-text-main truncate text-[0.9rem] leading-tight font-black">
                        {wine.nameKr}
                      </h3>
                      <span className="shrink-0 text-[0.75rem] font-black text-[#E5484D]">
                        {wine.matchRate}%
                      </span>
                    </div>
                    
                    <p className="mt-1 truncate text-[0.75rem] font-bold text-[#FF8A00]">
                      {(wine.pairingFoods || []).map((food) => `#${food}`).join(' ') ||
                        `${activeSituation} 상황에 추천`}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 0L6.12257 3.45492H9.75528L6.81636 5.59017L7.93893 9.04508L5 6.90983L2.06107 9.04508L3.18364 5.59017L0.244718 3.45492H3.87743L5 0Z" fill="#F59E0B"/>
                        </svg>
                        <span className="text-[0.75rem] font-black text-[#3C2E2E]">
                          {wine.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      <span className="text-text-main/20 text-[0.7rem]">|</span>
                      <span className="text-[#DF5A61] text-[0.75rem] font-black">
                        {formatPrice(wine.price)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="text-[#3C2E2E]/20 shrink-0" size={18} />
                </article>
              </Link>
            ))
          ) : (
            <div className="text-text-main/40 py-10 text-center font-bold">
              해당 상황에 대한 추천 와인이 없습니다.
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
