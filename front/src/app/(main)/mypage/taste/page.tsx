'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import TasteProfileForm, { TasteData } from '@/features/wine/components/TasteProfileForm';

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

  const handleDataChange = (newData: Partial<TasteData>) => {
    setTasteData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  const handleSave = () => {
    // API 연동 시 여기에 저장 로직 추가
    console.log('Saved Taste Data:', tasteData);
    router.push('/mypage');
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
        <TasteProfileForm data={tasteData} onChange={handleDataChange} />

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
