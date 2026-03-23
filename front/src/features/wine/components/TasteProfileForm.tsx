'use client';

import { cn } from '@/lib/utils';

const TASTE_FACTORS = [
  {
    label: '당도',
    key: 'sweet' as const,
    max: 5,
    descriptions: ['완전 드라이', '드라이', '약간 달콤', '달콤', '매우 달콤'],
  },
  {
    label: '산도',
    key: 'acid' as const,
    max: 5,
    descriptions: ['거의 없음', '부드러움', '적당함', '상큼함', '매우 상큼'],
  },
  {
    label: '무게감',
    key: 'body' as const,
    max: 5,
    descriptions: ['아주 가벼움', '가벼움', '중간', '묵직함', '매우 묵직'],
  },
  {
    label: '타닌',
    key: 'tannin' as const,
    max: 5,
    descriptions: ['거의 없음', '매끄러움', '적당함', '조금 떫음', '많이 떫음'],
  },
  {
    label: '도수',
    key: 'abv' as const,
    max: 5,
    descriptions: ['0~5%', '5~10%', '10~15%', '15~20%', '20~25%'],
  },
];

const WINE_TYPES = ['레드', '화이트', '로제', '스파클링', '디저트', '주정강화'];
const FLAVOR_TAGS = ['과일향', '꽃향', '베리향', '스파이스', '오크'];
const DRINKING_SITUATIONS = ['선물', '혼술', '집들이', '모임', '데이트', '가족모임'];

export interface TasteData {
  tastes: {
    sweet: number;
    acid: number;
    body: number;
    tannin: number;
    abv: number;
  };
  selectedWineTypes: string[];
  selectedFlavorTags: string[];
  selectedSituations: string[];
}

interface TasteProfileFormProps {
  data: TasteData;
  onChange: (newData: Partial<TasteData>) => void;
}

export default function TasteProfileForm({ data, onChange }: TasteProfileFormProps) {
  const { tastes, selectedWineTypes, selectedFlavorTags, selectedSituations } = data;

  const handleTasteChange = (key: keyof TasteData['tastes'], value: number) => {
    onChange({ tastes: { ...tastes, [key]: value } });
  };

  const toggleItem = (list: string[], item: string, key: keyof TasteData) => {
    if (!item) return;
    const newList = list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    onChange({ [key]: newList });
  };

  return (
    <div className="space-y-10">
      {/* 1. 기본 취향 슬라이더 */}
      <section className="space-y-6">
        <h3 className="text-text-main text-[1.15rem] font-black">와인 취향 설정</h3>
        <div className="space-y-8">
          {TASTE_FACTORS.map((factor) => (
            <div key={factor.key} className="space-y-3">
              <p className="text-text-main/65 text-[13px] font-bold">{factor.label}</p>
              <div className="relative h-8">
                <div className="bg-primary-100 absolute top-1/2 right-0 left-0 h-[2px] -translate-y-1/2" />
                <div className="absolute inset-0 flex items-center justify-between">
                  {Array.from({ length: factor.max }).map((_, index) => {
                    const value = index + 1;
                    const active = tastes[factor.key] === value;

                    return (
                      <div
                        key={value}
                        className={cn(
                          'rounded-full transition-all',
                          active ? 'h-5 w-5 bg-[#B17672]' : 'bg-primary-100 h-2.5 w-2.5',
                        )}
                      />
                    );
                  })}
                </div>
                <input
                  type="range"
                  min="1"
                  max={factor.max}
                  step="1"
                  value={tastes[factor.key] || 3}
                  onChange={(e) => handleTasteChange(factor.key, Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
                />
              </div>
              <div className="relative mt-1.5 h-6">
                {factor.descriptions.map((desc, i) => {
                  const isActive = tastes[factor.key] === i + 1;
                  const left = `${i * 25}%`;
                  return (
                    <span
                      key={i}
                      className={cn(
                        'absolute top-0 text-[10px] font-bold whitespace-nowrap transition-all',
                        isActive ? 'scale-110 text-[#B17672]' : 'text-text-main/20',
                      )}
                      style={{
                        left,
                        transform:
                          i === 0 ? 'none' : i === 4 ? 'translateX(-100%)' : 'translateX(-50%)',
                      }}
                    >
                      {desc}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 선호 와인 종류 */}
      <section className="space-y-3">
        <h3 className="text-text-main text-[1.1rem] font-black">선호 와인 종류</h3>
        <p className="text-text-main/45 text-[13px]">좋아하는 와인 종류를 선택해주세요</p>
        <div className="grid grid-cols-2 gap-3">
          {WINE_TYPES.map((type) => {
            const isActive = selectedWineTypes.includes(type);
            const emoji =
              type === '레드'
                ? '🍷'
                : type === '화이트'
                  ? '🥂'
                  : type === '로제'
                    ? '🍇'
                    : type === '스파클링'
                      ? '✨'
                      : type === '디저트'
                        ? '🍰'
                        : '🥃';

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleItem(selectedWineTypes, type, 'selectedWineTypes')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-[1.5rem] border bg-white px-4 py-4 text-[15px] font-black transition-all',
                  isActive
                    ? 'text-text-main border-[#D26C66]'
                    : 'border-primary-100 text-text-main/70',
                )}
              >
                <span className="text-[13px]">{emoji}</span>
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 좋아하는 맛/향 */}
      <section className="space-y-3">
        <h3 className="text-text-main text-[1.1rem] font-black">좋아하는 맛/향</h3>
        <p className="text-text-main/45 text-[13px]">AI 추천에 반영됩니다</p>
        <div className="flex flex-wrap gap-2">
          {FLAVOR_TAGS.map((tag, index) => {
            const isActive = selectedFlavorTags.includes(tag);

            return (
              <button
                key={`${tag}-${index}`}
                type="button"
                onClick={() => toggleItem(selectedFlavorTags, tag, 'selectedFlavorTags')}
                className={cn(
                  'rounded-full px-4 py-2.5 text-[13px] font-bold transition-all',
                  isActive ? 'bg-[#CC7A7A] text-white' : 'bg-primary-100/60 text-text-main/80',
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. 음용 상황 */}
      <section className="space-y-3">
        <h3 className="text-text-main text-[1.1rem] font-black">주요 음용 상황 선택하기</h3>
        <div className="flex flex-wrap gap-2">
          {DRINKING_SITUATIONS.map((situation) => {
            const isActive = selectedSituations.includes(situation);

            return (
              <button
                key={situation}
                type="button"
                onClick={() => toggleItem(selectedSituations, situation, 'selectedSituations')}
                className={cn(
                  'rounded-full px-5 py-3 text-[14px] font-bold transition-all',
                  isActive ? 'bg-[#CC7A7A] text-white' : 'bg-primary-100/60 text-text-main/80',
                )}
              >
                {situation}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
