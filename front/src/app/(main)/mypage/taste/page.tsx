'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import {
  useUpdatePreferenceMutation,
  usePreferenceQuery,
} from '@/features/user/hooks/useUserQueries';
import { UpdatePreferenceRequest } from '@/types/user.types';
import TasteProfileForm, { TasteData } from '@/features/wine/components/TasteProfileForm';
import { useToastStore } from '@/stores/toast.store';

const WINE_TYPE_MAP: Record<string, string> = {
  RED: '레드',
  WHITE: '화이트',
  ROSE: '로제',
  SPARKLING: '스파클링',
  DESSERT: '디저트',
  FORTIFIED: '주정강화',
};

const FLAVOR_MAP: Record<string, string> = {
  FRUIT: '과일향',
  FLOWER: '꽃향',
  BERRY: '베리향',
  SPICE: '스파이스',
  OAK: '오크',
};

const SITUATION_MAP: Record<string, string> = {
  GIFT: '선물',
  ALONE: '혼술',
  HOUSEWARMING: '집들이',
  PARTY: '모임',
  DATE: '데이트',
  FAMILY: '가족모임',
};

export default function TasteEditPage() {
  const { data: preference, isLoading } = usePreferenceQuery();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // 데이터가 없을 경우(신규 유저 등)에도 기본값으로 폼을 보여주기 위해 빈 객체 처리
  return <PreferenceFormContent initialPreference={preference} />;
}

function PreferenceFormContent({
  initialPreference,
}: {
  initialPreference?: UpdatePreferenceRequest | null;
}) {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const updatePreferenceMutation = useUpdatePreferenceMutation();

  const [tasteData, setTasteData] = useState<TasteData>(() => ({
    tastes: {
      sweet: initialPreference?.sweetness ?? 3,
      acid: initialPreference?.acidity ?? 3,
      body: initialPreference?.body ?? 3,
      tannin: initialPreference?.tannin ?? 3,
      abv: initialPreference?.abv ?? 3,
    },
    selectedWineTypes: (initialPreference?.preferredTypes ?? []).map((t) => WINE_TYPE_MAP[t] || t),
    selectedFlavorTags: (initialPreference?.preferredFlavors ?? []).map((f) => FLAVOR_MAP[f] || f),
    selectedSituations: (initialPreference?.drinkingSituations ?? []).map(
      (s) => SITUATION_MAP[s] || s,
    ),
  }));

  const handleSave = async () => {
    try {
      const reverseMap = (map: Record<string, string>) => {
        const reversed: Record<string, string> = {};
        Object.entries(map).forEach(([k, v]) => {
          reversed[v] = k;
        });
        return reversed;
      };

      const INV_WINE_TYPE_MAP = reverseMap(WINE_TYPE_MAP);
      const INV_FLAVOR_MAP = reverseMap(FLAVOR_MAP);
      const INV_SITUATION_MAP = reverseMap(SITUATION_MAP);

      const payload: UpdatePreferenceRequest = {
        sweetness: tasteData.tastes.sweet,
        acidity: tasteData.tastes.acid,
        body: tasteData.tastes.body,
        tannin: tasteData.tastes.tannin,
        abv: tasteData.tastes.abv,
        preferredTypes: tasteData.selectedWineTypes.map((t) => INV_WINE_TYPE_MAP[t] || t),
        preferredFlavors: tasteData.selectedFlavorTags.map((f) => INV_FLAVOR_MAP[f] || f),
        drinkingSituations: tasteData.selectedSituations.map((s) => INV_SITUATION_MAP[s] || s),
      };

      await updatePreferenceMutation.mutateAsync(payload);
      addToast('설정이 완료되었습니다.', 'success');
      router.push('/mypage');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      addToast('취향 정보를 저장하는 중 오류가 발생했습니다.', 'error');
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

      <main className="animate-in fade-in slide-in-from-right-8 flex-1 space-y-8 px-4 py-5 pb-0 duration-300">
        <div className="space-y-10">
          <div className="space-y-2">
            <h2 className="text-primary-700 text-xs font-black tracking-widest uppercase">
              Taste Profile
            </h2>
            <h3 className="text-text-main text-xl font-black">어떤 스타일을 좋아하시나요?</h3>
          </div>

          <TasteProfileForm data={tasteData} onChange={handleDataChange} />
        </div>

        <div className="fixed right-0 bottom-0 left-0 bg-white/80 p-4 backdrop-blur-md">
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
