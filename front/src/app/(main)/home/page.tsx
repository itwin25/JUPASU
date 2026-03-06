'use client';

import Header from '@/components/common/header/Header';
import SectionTitle from '@/components/common/section-title/SectionTitle';
import WineList from '@/features/wine/components/WineList';
import BottomNav from '@/components/common/bottom-nav/BottomNav';
import { Wine } from '@/features/wine/types/wine.types';

// 더미 데이터
const MOCK_WINES: Wine[] = [
  {
    id: 1,
    name: '샤또 마고 2018',
    origin: '프랑스',
    price: 1200000,
    type: 'RED',
    imageUrl: '',
    rating: 4.8,
    taste: { sweetness: 1, acidity: 3, tannin: 5, body: 5 }
  },
  {
    id: 2,
    name: '클라우디 베이 쏘비뇽 블랑',
    origin: '뉴질랜드',
    price: 45000,
    type: 'WHITE',
    imageUrl: '',
    rating: 4.5,
    taste: { sweetness: 1, acidity: 5, tannin: 1, body: 2 }
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="주(酒)파수" showBackButton={false} />
      <main className="px-4 py-4 space-y-8">
        <section>
          <SectionTitle title="오늘의 추천 와인" rightSlot="전체보기" />
          <WineList wines={MOCK_WINES} />
        </section>
        
        <section>
          <SectionTitle title="인기 레드 와인" />
          <WineList wines={MOCK_WINES.slice(0, 1)} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
