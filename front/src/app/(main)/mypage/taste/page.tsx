'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import Chip from '@/components/ui/chip/Chip';
import { cn } from '@/lib/utils';

const TASTE_FACTORS = [
  { label: '당도', key: 'sweet' },
  { label: '상큼함', key: 'fresh' },
  { label: '무게감', key: 'body' },
  { label: '타닌', key: 'tannin' },
  { label: '향', key: 'aroma' },
];

const WINE_TYPES = ['레드', '화이트', '로제', '스파클링'];
const FLAVOR_TAGS = ['과일향', '꽃향', '꽃향', '꿀향', '꽃향', '', '', '베리류', '베리류', '', ''];
const DRINKING_SITUATIONS = ['선물', '혼술', '집들이', '데이트', '가족모임'];

export default function TasteEditPage() {
  const router = useRouter();
  const [tastes, setTastes] = useState({
    sweet: 6,
    fresh: 6,
    body: 6,
    tannin: 6,
    aroma: 6,
  });
  const [selectedWineTypes, setSelectedWineTypes] = useState<string[]>(['레드', '화이트']);
  const [selectedFlavorTags, setSelectedFlavorTags] = useState<string[]>(['과일향', '베리류']);
  const [selectedSituations, setSelectedSituations] = useState<string[]>(['집들이']);

  const handleTasteChange = (key: string, value: number) => {
    setTastes((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWineType = (type: string) => {
    setSelectedWineTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    );
  };

  const toggleFlavorTag = (tag: string) => {
    if (!tag) return;
    setSelectedFlavorTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const toggleSituation = (situation: string) => {
    setSelectedSituations((prev) =>
      prev.includes(situation) ? prev.filter((item) => item !== situation) : [...prev, situation],
    );
  };

  const handleSave = () => {
    // API 연동 시 여기에 저장 로직 추가
    router.push('/mypage');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center bg-background/80 px-4 py-4 backdrop-blur-md">
        <Link
          href="/mypage"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-100 bg-white shadow-sm"
        >
          <ChevronLeft size={20} className="text-text-main" />
        </Link>
        <h1 className="mr-9 flex-1 text-center text-[15px] font-black text-text-main">와인 취향 설정</h1>
      </header>

      <main className="flex-1 space-y-8 px-4 py-5">
        <section className="space-y-6">
          <h2 className="text-[1.15rem] font-black text-text-main">와인 취향 설정</h2>
          {/* ... (tastes mapping) */}
          <div className="space-y-8">
            {TASTE_FACTORS.map((factor) => (
              <div key={factor.key} className="space-y-3">
                <p className="text-[13px] font-bold text-text-main/65">{factor.label}</p>
                <div className="relative h-8">
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-primary-100" />
                  <div className="absolute inset-0 flex items-center justify-between">
                    {Array.from({ length: 9 }).map((_, index) => {
                      const value = index + 1;
                      const active = tastes[factor.key as keyof typeof tastes] === value;

                      return (
                        <div
                          key={value}
                          className={cn(
                            'rounded-full transition-all',
                            active ? 'h-5 w-5 bg-[#B17672]' : 'h-2.5 w-2.5 bg-primary-100',
                          )}
                        />
                      );
                    })}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    step="1"
                    value={tastes[factor.key as keyof typeof tastes]}
                    onChange={(event) => handleTasteChange(factor.key, Number(event.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-transparent
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-[1.1rem] font-black text-text-main">선호 와인 종류</h3>
          <p className="text-[13px] text-text-main/45">좋아하는 와인 종류를 선택해주세요</p>
          <div className="grid grid-cols-2 gap-3">
            {WINE_TYPES.map((type) => {
              const isActive = selectedWineTypes.includes(type);
              const emoji =
                type === '레드' ? '🍷' : type === '화이트' ? '🥂' : type === '로제' ? '🍇' : '✨';

              return (
                <button
                  key={type}
                  onClick={() => toggleWineType(type)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-[1.5rem] border bg-white px-4 py-4 text-[15px] font-black transition-all',
                    isActive
                      ? 'border-[#D26C66] text-text-main'
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

        <section className="space-y-3">
          <h3 className="text-[1.1rem] font-black text-text-main">좋아하는 맛/향</h3>
          <p className="text-[13px] text-text-main/45">AI 추천에 반영됩니다</p>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag, index) => {
              if (!tag) {
                return <div key={`empty-${index}`} className="h-10 w-[3.6rem] rounded-full bg-primary-100/60" />;
              }

              const isActive = selectedFlavorTags.includes(tag);

              return (
                <button
                  key={`${tag}-${index}`}
                  onClick={() => toggleFlavorTag(tag)}
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

        <section className="space-y-3">
          <h3 className="text-[1.1rem] font-black text-text-main">주요 음용 상황 선택하기</h3>
          <div className="flex flex-wrap gap-2">
            {DRINKING_SITUATIONS.map((situation) => {
              const isActive = selectedSituations.includes(situation);

              return (
                <button
                  key={situation}
                  onClick={() => toggleSituation(situation)}
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

        <div className="pt-4 pb-10">
          <Button
            size="full"
            className="h-12 rounded-[1.25rem] bg-[#B36262] text-[13px] font-black shadow-md"
            onClick={handleSave}
          >
            변경사항 저장
          </Button>
        </div>
      </main>
    </div>
  );
}
