'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/common/header/Header';
import SectionTitle from '@/components/common/section-title/SectionTitle';
import WineTasteProfile from '@/features/wine/components/WineTasteProfile';
import ReviewForm from '@/features/review/components/ReviewForm';
import ReviewList from '@/features/review/components/ReviewList';
import Card from '@/components/ui/card/Card';
import Badge from '@/components/ui/badge/Badge';

export default function WineDetailPage() {
  const { wineId } = useParams();

  // 더미 데이터
  const mockWine = {
    id: Number(wineId),
    name: '샤또 마고 2018',
    origin: '프랑스',
    price: 1200000,
    type: 'RED' as const,
    imageUrl: '',
    rating: 4.8,
    taste: { sweetness: 1, acidity: 3, tannin: 5, body: 5 }
  };

  const mockReviews = [
    {
      id: 1,
      wineId: Number(wineId),
      userId: 1,
      userNickname: '와인러버',
      rating: 5,
      content: '바디감이 훌륭하고 끝맛이 깔끔해요. 기념일에 마시기 정말 좋았습니다.',
      createdAt: '2024-03-05'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header title="와인 정보" />
      <main className="p-4 space-y-8">
        {/* 와인 요약 정보 */}
        <section className="space-y-4">
          <div className="aspect-[3/4] w-full bg-white rounded-2xl flex items-center justify-center p-8 border border-gray-100 shadow-sm">
             <p className="text-gray-300">이미지 영역</p>
          </div>
          <div className="space-y-1">
            <Badge variant="primary">{mockWine.type}</Badge>
            <h1 className="text-2xl font-bold text-text-main">{mockWine.name}</h1>
            <p className="text-text-main/50">{mockWine.origin}</p>
          </div>
        </section>

        {/* 맛 프로파일 */}
        <section>
          <SectionTitle title="맛 프로파일" />
          <WineTasteProfile taste={mockWine.taste} />
        </section>

        {/* 리뷰 작성 */}
        <section>
          <SectionTitle title="리뷰 남기기" />
          <ReviewForm wineId={Number(wineId)} />
        </section>

        {/* 리뷰 리스트 */}
        <section className="pb-8">
          <SectionTitle 
            title="사용자 리뷰" 
            rightSlot={<span className="text-text-main/40 font-normal">{mockReviews.length}개</span>} 
          />
          <ReviewList reviews={mockReviews} />
        </section>
      </main>
    </div>
  );
}
