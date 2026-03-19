'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import { cn } from '@/lib/utils';
import { useUpdatePreferenceMutation } from '@/features/user/hooks/useUserQueries';
import { UpdatePreferenceRequest } from '@/types/user.types';
import TasteProfileForm, { TasteData } from '@/features/wine/components/TasteProfileForm';

const TASTE_FACTORS = [
  { label: '당도', key: 'sweet' },
  { label: '상큼함', key: 'acid' },
  { label: '무게감', key: 'body' },
  { label: '타닌', key: 'tannin' },
  { label: '향', key: 'aroma' },
];

const WINE_TYPES = ['레드', '화이트', '로제', '스파클링'];
const FLAVOR_TAGS = ['과일향', '꽃향', '꽃향', '꿀향', '꽃향', '', '', '베리류', '베리류', '', ''];
const DRINKING_SITUATIONS = ['선물', '혼술', '집들이', '데이트', '가족모임'];

export default function TasteEditPage() {
  const router = useRouter();
  const [tasteData, setTasteData] = useState<TasteData>({
    tastes: {
      sweet: 3,
      acid: 3,
      body: 3,
      tannin: 3,
      abv: 3,
    },
    selectedWineTypes: ['레드', '화이트'],
    selectedFlavorTags: ['과일향', '베리향'],
    selectedSituations: ['집들이'],
  });

  const updatePreferenceMutation = useUpdatePreferenceMutation();

  const handleTasteChange = (key: string, value: number) => {
    setTasteData((prev) => ({
      ...prev,
      tastes: { ...prev.tastes, [key]: value },
    }));
  };

  const toggleWineType = (type: string) => {
    setTasteData((prev) => ({
      ...prev,
      selectedWineTypes: prev.selectedWineTypes.includes(type)
        ? prev.selectedWineTypes.filter((item) => item !== type)
        : [...prev.selectedWineTypes, type],
    }));
  };

  const toggleFlavorTag = (tag: string) => {
    if (!tag) return;
    setTasteData((prev) => ({
      ...prev,
      selectedFlavorTags: prev.selectedFlavorTags.includes(tag)
        ? prev.selectedFlavorTags.filter((item) => item !== tag)
        : [...prev.selectedFlavorTags, tag],
    }));
  };

  const toggleSituation = (situation: string) => {
    setTasteData((prev) => ({
      ...prev,
      selectedSituations: prev.selectedSituations.includes(situation)
        ? prev.selectedSituations.filter((item) => item !== situation)
        : [...prev.selectedSituations, situation],
    }));
  };

  const handleSave = async () => {
    try {
      const payload: UpdatePreferenceRequest = {
        sweetness: tasteData.tastes.sweet,
        acidity: tasteData.tastes.acid,
        body: tasteData.tastes.body,
        tannin: tasteData.tastes.tannin,
        // aroma는 백엔드에 직접적인 컬럼이 없으므로 preferredFlavors 등 다른 필드에 활용되거나 제외
        preferredTypes: tasteData.selectedWineTypes,
        preferredFlavors: tasteData.selectedFlavorTags,
        drinkingSituations: tasteData.selectedSituations,
      };

      await updatePreferenceMutation.mutateAsync(payload);
      router.push('/mypage');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      alert('취향 정보를 저장하는 중 오류가 발생했습니다.');
    }
  };

  const handleDataChange = (newData: Partial<TasteData>) => {
    setTasteData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="bg-background/80 sticky top-0 z-10 flex items-center px-4 py-4 backdrop-blur-md">
        <Link
          href="/mypage"
          className="border-primary-100 flex h-9 w-9 items-center justify-center rounded-full border bg-white shadow-sm"
        >
          <ChevronLeft size={20} className="text-text-main" />
        </Link>
        <h1 className="text-text-main mr-9 flex-1 text-center text-[15px] font-black">
          와인 취향 설정
        </h1>
      </header>

      <main className="flex-1 space-y-8 px-4 py-5">
        <section className="space-y-6">
          <h2 className="text-text-main text-[1.15rem] font-black">와인 취향 설정</h2>
          {/* ... (tastes mapping) */}
          <div className="space-y-8">
            {TASTE_FACTORS.map((factor) => (
              <div key={factor.key} className="space-y-3">
                <p className="text-text-main/65 text-[13px] font-bold">{factor.label}</p>
                <div className="relative h-8">
                  <div className="bg-primary-100 absolute top-1/2 right-0 left-0 h-[2px] -translate-y-1/2" />
                  <div className="absolute inset-0 flex items-center justify-between">
                    {Array.from({ length: 9 }).map((_, index) => {
                      const value = index + 1;
                      const active =
                        tasteData.tastes[factor.key as keyof typeof tasteData.tastes] === value;

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
                    max="9"
                    step="1"
                    value={tasteData.tastes[factor.key as keyof typeof tasteData.tastes]}
                    onChange={(event) => handleTasteChange(factor.key, Number(event.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-text-main text-[1.1rem] font-black">선호 와인 종류</h3>
          <p className="text-text-main/45 text-[13px]">좋아하는 와인 종류를 선택해주세요</p>
          <div className="grid grid-cols-2 gap-3">
            {WINE_TYPES.map((type) => {
              const isActive = tasteData.selectedWineTypes.includes(type);
              const emoji =
                type === '레드' ? '🍷' : type === '화이트' ? '🥂' : type === '로제' ? '🍇' : '✨';

              return (
                <button
                  key={type}
                  onClick={() => toggleWineType(type)}
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

        <section className="space-y-3">
          <h3 className="text-text-main text-[1.1rem] font-black">좋아하는 맛/향</h3>
          <p className="text-text-main/45 text-[13px]">AI 추천에 반영됩니다</p>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_TAGS.map((tag, index) => {
              if (!tag) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="bg-primary-100/60 h-10 w-[3.6rem] rounded-full"
                  />
                );
              }

              const isActive = tasteData.selectedFlavorTags.includes(tag);

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
          <h3 className="text-text-main text-[1.1rem] font-black">주요 음용 상황 선택하기</h3>
          <div className="flex flex-wrap gap-2">
            {DRINKING_SITUATIONS.map((situation) => {
              const isActive = tasteData.selectedSituations.includes(situation);

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
        <TasteProfileForm data={tasteData} onChange={handleDataChange} />

        <div className="pt-4 pb-10">
          <Button
            size="full"
            className="relative h-12 rounded-[1.25rem] bg-[#B36262] text-[13px] font-black shadow-md"
            onClick={handleSave}
            disabled={updatePreferenceMutation.isPending}
          >
            {updatePreferenceMutation.isPending ? '저장 중...' : '변경사항 저장'}
          </Button>
        </div>
      </main>
    </div>
  );
}
