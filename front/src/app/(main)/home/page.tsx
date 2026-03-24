'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Chip from '@/components/ui/chip/Chip';
import Modal from '@/components/ui/modal/Modal';
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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
    <div className="bg-background min-h-screen pb-0">
      <div className="bg-background/88 sticky top-0 z-30 px-6 pt-4 pb-3 backdrop-blur-xl">
        <div className="flex justify-center">
          <div className="relative h-14 w-14">
            <Image src="/logo.png" alt="JUPASU" fill className="object-contain" />
          </div>
        </div>
      </div>

      <section className="px-6 pt-4 pb-6">
        <div className="mb-4 flex items-center gap-1.5">
          <h2 className="text-text-main text-xl font-black tracking-tight uppercase italic">
            VIBE GALLERY
          </h2>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="transition-transform active:scale-90"
          >
            <svg
              width="18"
              height="17"
              viewBox="0 0 18 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.54773 16.944C13.2685 16.944 17.0955 13.151 17.0955 8.472C17.0955 3.79304 13.2685 0 8.54773 0C3.82695 0 0 3.79304 0 8.472C0 13.151 3.82695 16.944 8.54773 16.944Z"
                fill="#B36262"
              />
              <path
                d="M7.25928 10.75V10.7031C7.26449 10.2057 7.31657 9.8099 7.41553 9.51562C7.51449 9.22135 7.65511 8.98307 7.8374 8.80078C8.01969 8.61849 8.23844 8.45052 8.49365 8.29687C8.6473 8.20312 8.78532 8.09245 8.90771 7.96484C9.03011 7.83464 9.12646 7.6849 9.19678 7.51562C9.26969 7.34635 9.30615 7.15885 9.30615 6.95312C9.30615 6.69792 9.24626 6.47656 9.12646 6.28906C9.00667 6.10156 8.84652 5.95703 8.646 5.85547C8.44548 5.75391 8.22282 5.70312 7.97803 5.70312C7.76449 5.70312 7.55876 5.7474 7.36084 5.83594C7.16292 5.92448 6.99756 6.0638 6.86475 6.25391C6.73193 6.44401 6.65511 6.69271 6.63428 7H5.6499C5.67074 6.55729 5.78532 6.17839 5.99365 5.86328C6.20459 5.54818 6.48193 5.30729 6.82568 5.14062C7.17204 4.97396 7.55615 4.89062 7.97803 4.89062C8.43636 4.89062 8.8348 4.98177 9.17334 5.16406C9.51449 5.34635 9.77751 5.59635 9.9624 5.91406C10.1499 6.23177 10.2437 6.59375 10.2437 7C10.2437 7.28646 10.1994 7.54557 10.1108 7.77734C10.0249 8.00911 9.8999 8.21615 9.73584 8.39844C9.57438 8.58073 9.37907 8.74219 9.1499 8.88281C8.92074 9.02604 8.73714 9.17708 8.59912 9.33594C8.4611 9.49219 8.36084 9.67839 8.29834 9.89453C8.23584 10.1107 8.20199 10.3802 8.19678 10.7031V10.75H7.25928ZM7.75928 13.0625C7.56657 13.0625 7.4012 12.9935 7.26318 12.8555C7.12516 12.7174 7.05615 12.5521 7.05615 12.3594C7.05615 12.1667 7.12516 12.0013 7.26318 11.8633C7.4012 11.7253 7.56657 11.6562 7.75928 11.6562C7.95199 11.6562 8.11735 11.7253 8.25537 11.8633C8.39339 12.0013 8.4624 12.1667 8.4624 12.3594C8.4624 12.487 8.42985 12.6042 8.36475 12.7109C8.30225 12.8177 8.21761 12.9036 8.11084 12.9687C8.00667 13.0313 7.88949 13.0625 7.75928 13.0625Z"
                fill="white"
              />
            </svg>
          </button>
        </div>

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
                          ...(wine.pairingFoods || []).slice(0, 2).map((food) => `#${food}`),
                          formatPriceTag(wine.price) ? `#${formatPriceTag(wine.price)}` : null,
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
          소믈리에 PICK
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

      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="와인 용어 설명"
        hideDefaultFooter
      >
        <div className="bg-primary-100/80 mb-4 h-px" />
        <div className="text-text-main space-y-4 text-[13px] leading-relaxed">
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">탄닌 (Tannin)</h4>
            <p className="text-text-main/80 text-[12px]">
              입안을 마르게 하거나 떫은 맛을 내는 성분이에요. 주로 포도 껍질과 씨에서 나옵니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">산미 (Acidity)</h4>
            <p className="text-text-main/80 text-[12px]">
              포도의 산 성분으로 인해 느껴지는 신맛이에요. 와인에 상쾌함과 생기를 줍니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">바디 (Body)</h4>
            <p className="text-text-main/80 text-[12px]">
              입안에서 느껴지는 와인의 무게감이나 질감이에요. 물(가벼움)과 우유(무거움)의 차이와
              비슷해요.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">당도 (Sweetness)</h4>
            <p className="text-text-main/80 text-[12px]">
              와인에서 느껴지는 단맛이에요. 발효 후 남은 잔당의 양에 따라 결정됩니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">도수 (Alcohol)</h4>
            <p className="text-text-main/80 text-[12px]">
              와인에 포함된 알코올의 비율이에요. 효모가 당을 분해하여 생성합니다.
            </p>
          </div>
        </div>
      </Modal>

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
