'use client';

import { useState } from 'react';
import Header from '@/components/common/header/Header';
import PageTitle from '@/components/common/page-title/PageTitle';
import SectionTitle from '@/components/common/section-title/SectionTitle';
import TasteSliderGroup from '@/features/onboarding/components/TasteSliderGroup';
import PriceRangeSelector from '@/features/onboarding/components/PriceRangeSelector';
import SituationSelector from '@/features/onboarding/components/SituationSelector';
import Button from '@/components/ui/button/Button';

export default function TasteOnboardingPage() {
  const [tastes, setTastes] = useState<Record<string, number>>({
    sweet: 5,
    acid: 5,
    body: 5,
    tannin: 5,
    aroma: 5,
  });

  const handleTasteChange = (key: string, value: number) => {
    setTastes((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="취향 분석" />
      <main className="px-6 py-8 space-y-10">
        <PageTitle 
          title="취향 분석" 
          description="선호하시는 맛과 상황을 알려주시면 최적의 와인을 추천해드릴게요." 
        />
        
        <section>
          <SectionTitle title="선호하는 맛" />
          <TasteSliderGroup tastes={tastes} onChange={handleTasteChange} />
        </section>

        <section>
          <SectionTitle title="예산 범위" />
          <PriceRangeSelector />
        </section>

        <section>
          <SectionTitle title="어떤 상황에서 마시나요?" />
          <SituationSelector />
        </section>

        <div className="fixed bottom-0 left-0 w-full p-6 bg-background/80 backdrop-blur-md">
          <Button size="full">분석 결과 확인하기</Button>
        </div>
      </main>
    </div>
  );
}
