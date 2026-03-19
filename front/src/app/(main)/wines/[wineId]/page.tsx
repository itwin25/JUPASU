'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, MoreHorizontal, PenSquare, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ReviewModal } from '@/features/review/components';
import {
  useWineScrapListQuery,
  useWineScrapMutation,
} from '@/features/wine/hooks/useWineListQuery';

type ReviewItem = {
  id: number;
  user: string;
  rating: number;
  content: string;
  date: string;
  avatar: string;
};

export default function WineDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ wineId: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: number;
    rating: number;
    content: string;
  } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating'>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const wineInfo = {
    id: Number(params.wineId),
    name: 'Chateau Margaux',
    category: 'BORDEAUX RED',
    country: '프랑스',
    flag: 'FR',
    match: 95,
    rating: 4.8,
    reviewCount: 2,
    price: '120,000',
    description:
      '깊고 복합적인 향이 특징인 보르도 명품 와인입니다. 블랙커런트와 바이올렛, 삼나무 향이 어우러지며 실크 같은 탄닌이 매력적으로 남습니다.',
    tasteProfile: {
      body: 5,
      sweet: 2,
      acid: 3,
      tannin: 5,
    },
    reason:
      '무게감 있는 레드 와인을 좋아하는 취향과 잘 맞고, 스테이크나 진한 육류 요리와의 궁합이 좋아 추천해드려요.',
    tags: ['과일향', '오크향', '스파이시', '부드러움'],
    foods: ['스테이크', '양갈비', '하드 치즈'],
    similarWines: [
      {
        id: 2,
        name: '12 Crimes Red',
        desc: '한잔의 피로를 녹여줄 한 잔',
        price: '25,000',
        match: 95,
      },
      {
        id: 3,
        name: '20 Crimes Red',
        desc: '의주의 피로를 녹여줄 한 잔',
        price: '250,000',
        match: 95,
      },
      {
        id: 4,
        name: '190 Crimes Red',
        desc: '10년의 피로를 녹여줄 한 잔',
        price: '2,500,000',
        match: 95,
      },
    ],
  };

  const { data: scrapListData } = useWineScrapListQuery();
  const wineScrapMutation = useWineScrapMutation();

  const isScraped = useMemo(
    () =>
      (scrapListData ?? []).some(
        (item) => item.wineId === wineInfo.id || item.scrapId === wineInfo.id,
      ),
    [scrapListData, wineInfo.id],
  );

  const reviews: ReviewItem[] = [
    {
      id: 1,
      user: '와인수인',
      rating: 4,
      content: '와인의 구조감과 향이 좋아서 만족스러웠어요. 스테이크랑 특히 잘 어울렸습니다.',
      date: '2026.01.05',
      avatar: '🍷',
    },
    {
      id: 2,
      user: '보르도매니아',
      rating: 5,
      content: '오크와 과실 향이 선명하고 밸런스가 좋아요. 특별한 날 마시기 정말 좋았습니다.',
      date: '2025.12.20',
      avatar: '🍇',
    },
  ];

  const handleOpenWriteModal = () => {
    setEditingReview(null);
    setIsReviewModalOpen(true);
  };

  const handleOpenEditModal = (review: { id: number; rating: number; content: string }) => {
    setEditingReview(review);
    setActiveMenuId(null);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = (data: { rating: number; content: string }) => {
    console.log('Submitted Review:', data, editingReview ? 'Editing' : 'Creating');
    setIsReviewModalOpen(false);
  };

  const handleReviewDelete = () => {
    console.log('Deleting review', editingReview?.id);
    setIsReviewModalOpen(false);
  };

  const handleScrapClick = async () => {
    try {
      await wineScrapMutation.mutateAsync(wineInfo.id);
    } catch (error) {
      console.error('Failed to toggle wine scrap', error);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-28">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <header className="fixed inset-x-0 top-0 z-20 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="app-shell flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="border-primary-100 flex h-10 w-10 items-center justify-center rounded-full border bg-white/92 shadow-[0_6px_16px_rgba(51,34,17,0.08)] backdrop-blur-sm"
          >
            <ChevronLeft size={20} className="text-text-main" />
          </button>
          <button
            onClick={handleScrapClick}
            disabled={wineScrapMutation.isPending}
            className={cn(
              'border-primary-100 flex h-10 w-10 items-center justify-center rounded-full border bg-white/92 shadow-[0_6px_16px_rgba(51,34,17,0.08)] backdrop-blur-sm transition-colors',
              isScraped ? 'text-[#C96D72]' : 'text-text-main',
              wineScrapMutation.isPending && 'opacity-60',
            )}
            aria-label={isScraped ? '와인 스크랩 취소' : '와인 스크랩'}
          >
            <Heart size={18} fill={isScraped ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      <main className="no-scrollbar overflow-y-auto pt-20">
        <div className="app-shell px-5 pb-10">
          <section className="space-y-6">
            <div className="relative aspect-[1/0.78] overflow-hidden rounded-[1.9rem] bg-[#EBE2D5]">
              <div className="absolute inset-0 flex items-center justify-center text-[5.4rem]">
                🍷
              </div>
              <div className="absolute top-4 left-4 rounded-full bg-[#C96D72] px-3 py-1.5 text-[0.72rem] font-black text-white shadow-sm">
                {wineInfo.match}% MATCH
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-[0.7rem] font-black tracking-[0.14em] text-[#C96D72] uppercase">
                    {wineInfo.category}
                  </p>
                  <h1 className="text-text-main text-[1.4rem] leading-[1.12] font-black tracking-[-0.035em]">
                    {wineInfo.name}
                  </h1>
                </div>
                <span className="text-text-main pt-2 text-[0.8rem] font-black tracking-[0.02em]">
                  {wineInfo.flag}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[0.92rem] font-black text-[#FF9A3D]">
                  <Star size={15} fill="#FF9A3D" className="text-[#FF9A3D]" />
                  {wineInfo.rating}
                  <span className="text-text-main/38 text-[0.7rem] font-semibold">
                    ({wineInfo.reviewCount}) {wineInfo.country}
                  </span>
                </div>
                <span className="text-[1.2rem] font-black tracking-[-0.035em] text-[#C96D72]">
                  ₩{wineInfo.price}
                </span>
              </div>

              <div className="rounded-[1.6rem] border border-[#F2C9CC] bg-[#F9E8E9] px-4 py-3">
                <div className="text-[0.88rem] font-black text-[#C96D72]">AI 추천 이유</div>
                <p className="text-text-main/62 mt-1.5 text-[0.9rem] leading-relaxed font-medium">
                  {wineInfo.reason}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="rounded-[1.3rem] bg-[#ECE4D8] p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'rounded-[1rem] py-2.5 text-[0.88rem] font-black transition-all',
                    activeTab === 'info'
                      ? 'text-text-main bg-white shadow-sm'
                      : 'text-text-main/42',
                  )}
                >
                  상세 정보
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={cn(
                    'rounded-[1rem] py-2.5 text-[0.88rem] font-black transition-all',
                    activeTab === 'reviews'
                      ? 'text-text-main bg-white shadow-sm'
                      : 'text-text-main/42',
                  )}
                >
                  리뷰 ({wineInfo.reviewCount})
                </button>
              </div>
            </div>
          </section>

          {activeTab === 'info' ? (
            <section className="mt-7 space-y-8">
              <div className="space-y-3">
                <h3 className="text-text-main text-[1.05rem] font-black">설명</h3>
                <p className="text-text-main/62 text-[0.92rem] leading-[1.7] font-medium">
                  {wineInfo.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-text-main text-[1.05rem] font-black">맛 프로필</h3>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C96D72] text-[0.68rem] font-black text-white">
                    ?
                  </div>
                </div>

                <div className="border-primary-100 rounded-[1.5rem] border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(51,34,17,0.035)]">
                  {[
                    ['BODY', wineInfo.tasteProfile.body],
                    ['SWEET', wineInfo.tasteProfile.sweet],
                    ['ACID', wineInfo.tasteProfile.acid],
                    ['TANNIN', wineInfo.tasteProfile.tannin],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                    >
                      <span className="text-text-main/58 text-[0.82rem] font-black">{label}</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <div
                            key={step}
                            className={`h-2.5 w-2.5 rotate-45 ${
                              step <= Number(value) ? 'bg-[#C96D72]' : 'bg-primary-100'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {wineInfo.tags.map((tag, index) => (
                    <div
                      key={tag}
                      className={cn(
                        'rounded-full px-4 py-2 text-[0.76rem] font-black',
                        index === 0 || index === wineInfo.tags.length - 1
                          ? 'bg-[#C96D72] text-white'
                          : 'text-text-main/62 bg-[#EFE8DD]',
                      )}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-text-main text-[1.05rem] font-black">취향 그래프</h3>
                <div className="border-primary-100 aspect-[1/0.72] rounded-[1.6rem] border bg-white px-4 py-5 shadow-[0_8px_20px_rgba(51,34,17,0.035)]">
                  <div className="relative mx-auto h-full max-w-[15.5rem]">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      {[20, 40, 60, 80].map((r) => {
                        const points = Array.from({ length: 5 })
                          .map((_, i) => {
                            const angle = (i * 72 - 90) * (Math.PI / 180);
                            return `${50 + (r / 2) * Math.cos(angle)},${50 + (r / 2) * Math.sin(angle)}`;
                          })
                          .join(' ');
                        return (
                          <polygon
                            key={r}
                            points={points}
                            className="stroke-primary-100 fill-none stroke-[0.6]"
                          />
                        );
                      })}
                      {Array.from({ length: 5 }).map((_, i) => {
                        const angle = (i * 72 - 90) * (Math.PI / 180);
                        return (
                          <line
                            key={i}
                            x1="50"
                            y1="50"
                            x2={50 + 40 * Math.cos(angle)}
                            y2={50 + 40 * Math.sin(angle)}
                            className="stroke-primary-100 stroke-[0.6]"
                          />
                        );
                      })}
                      <polygon
                        points="50,18 76,38 70,73 37,80 22,43"
                        className="fill-[#C96D72]/12 stroke-[#D86E73] stroke-[1.3]"
                      />
                    </svg>
                    <span className="text-text-main/44 absolute top-[-0.3rem] left-1/2 -translate-x-1/2 text-[0.8rem] font-semibold">
                      탄닌
                    </span>
                    <span className="text-text-main/44 absolute top-[32%] right-[0.2rem] text-[0.8rem] font-semibold">
                      바디
                    </span>
                    <span className="text-text-main/44 absolute right-[2.5rem] bottom-[2%] text-[0.8rem] font-semibold">
                      아로마
                    </span>
                    <span className="text-text-main/44 absolute bottom-[2%] left-[3.5rem] -translate-x-1/2 text-[0.8rem] font-semibold">
                      과일
                    </span>
                    <span className="text-text-main/44 absolute top-[32%] left-[0.2rem] text-[0.8rem] font-semibold">
                      산미
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-text-main text-[1.05rem] font-black">음식 페어링</h3>
                <div className="flex flex-wrap gap-2.5">
                  {wineInfo.foods.map((food) => (
                    <div
                      key={food}
                      className="text-text-main/62 rounded-full bg-[#EFE8DD] px-4 py-2 text-[0.78rem] font-black"
                    >
                      {food}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-text-main text-[1.05rem] font-black">유사한 와인</h3>
                <div className="space-y-3">
                  {wineInfo.similarWines.map((wine) => (
                    <Link key={wine.id} href={`/wines/${wine.id}`} className="block">
                      <div className="border-primary-100 flex items-center gap-3 rounded-[1.45rem] border bg-white px-3 py-3 shadow-[0_8px_20px_rgba(51,34,17,0.035)] transition-transform active:scale-[0.985]">
                        <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-[1rem] bg-[#FCE7E7] text-[1.8rem]">
                          🍷
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-text-main truncate text-[0.92rem] font-black">
                            {wine.name}
                          </h4>
                          <p className="text-text-main/42 truncate text-[0.7rem] font-medium">
                            {wine.desc}
                          </p>
                          <p className="text-[0.88rem] font-black text-[#C96D72]">₩{wine.price}</p>
                        </div>
                        <div className="rounded-full bg-[#C96D72] px-2.5 py-1 text-[0.62rem] font-black text-white">
                          {wine.match}% MATCH
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="mt-7 space-y-5">
              <div className="border-primary-100 rounded-[1.7rem] border bg-white px-5 py-5 shadow-[0_8px_20px_rgba(51,34,17,0.035)]">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-text-main text-[2.7rem] leading-none font-black">
                      {wineInfo.rating}
                    </span>
                    <div className="mt-1 flex gap-0.5 text-[#FF9A3D]">
                      {[1, 2, 3, 4].map((star) => (
                        <Star key={star} size={14} fill="#FF9A3D" className="text-[#FF9A3D]" />
                      ))}
                      <Star size={14} fill="currentColor" className="text-primary-100" />
                    </div>
                    <span className="text-text-main/34 mt-1 text-[0.72rem] font-semibold">
                      {wineInfo.reviewCount}개의 리뷰
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((level) => (
                      <div key={level} className="flex items-center gap-2.5">
                        <span className="text-text-main/34 w-2 text-[0.68rem] font-semibold">
                          {level}
                        </span>
                        <div className="bg-primary-100 h-1.5 flex-1 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-[#D9AD70]"
                            style={{ width: level >= 4 ? '62%' : level === 3 ? '18%' : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <div className="relative">
                  <button
                    onClick={() => setIsSortMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-[0.95rem] bg-[#C96D72] px-4 py-2 text-[0.74rem] font-black text-white shadow-sm"
                  >
                    {sortOrder === 'recent' ? '최신순' : '평점순'}
                    <ChevronLeft
                      size={13}
                      className={cn(
                        'rotate-[270deg] transition-transform',
                        isSortMenuOpen && 'rotate-90',
                      )}
                    />
                  </button>

                  {isSortMenuOpen && (
                    <div className="border-primary-100 absolute top-full right-0 z-30 mt-2 w-24 rounded-[1rem] border bg-white p-1 shadow-xl">
                      {[
                        { id: 'rating', label: '평점순' },
                        { id: 'recent', label: '최신순' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSortOrder(item.id as 'recent' | 'rating');
                            setIsSortMenuOpen(false);
                          }}
                          className={cn(
                            'w-full rounded-[0.75rem] px-3 py-2 text-center text-[0.72rem] font-black',
                            sortOrder === item.id
                              ? 'bg-primary-100 text-[#C96D72]'
                              : 'text-text-main/62 hover:bg-gray-50',
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleOpenWriteModal}
                  className="border-primary-100 flex h-9 w-9 items-center justify-center rounded-[0.95rem] border bg-white text-[#C96D72] shadow-sm"
                >
                  <PenSquare size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-primary-100 relative rounded-[1.7rem] border bg-white px-5 py-5 shadow-[0_8px_20px_rgba(51,34,17,0.035)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary-100 flex h-10 w-10 items-center justify-center rounded-full text-lg">
                          {review.avatar}
                        </div>
                        <div>
                          <div className="text-text-main text-[0.88rem] font-black">
                            {review.user}
                          </div>
                          <div className="mt-1 flex gap-0.5 text-[#FF9A3D]">
                            {[1, 2, 3, 4].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                fill="#FF9A3D"
                                className="text-[#FF9A3D]"
                              />
                            ))}
                            <Star size={12} fill="currentColor" className="text-primary-100" />
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenuId(activeMenuId === review.id ? null : review.id)
                          }
                          className="text-text-main/28 p-1"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {activeMenuId === review.id && (
                          <div className="border-primary-100 absolute top-full right-0 z-30 mt-1 w-20 rounded-[0.9rem] border bg-white p-1 shadow-xl">
                            <button
                              onClick={() => handleOpenEditModal(review)}
                              className="text-text-main w-full rounded-[0.7rem] py-2 text-center text-[0.7rem] font-black hover:bg-gray-50"
                            >
                              수정
                            </button>
                            <div className="bg-primary-100/60 mx-1 h-px" />
                            <button className="w-full rounded-[0.7rem] py-2 text-center text-[0.7rem] font-black text-red-400 hover:bg-red-50">
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-text-main/68 mt-4 text-[0.9rem] leading-[1.7] font-medium">
                      {review.content}
                    </p>

                    <div className="text-text-main/28 mt-4 text-right text-[0.68rem] font-semibold">
                      {review.date}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <ReviewModal
        key={`${isReviewModalOpen}-${editingReview?.id ?? 'new'}`}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        onDelete={handleReviewDelete}
        initialData={
          editingReview
            ? { rating: editingReview.rating, content: editingReview.content }
            : undefined
        }
        wineInfo={{ name: wineInfo.name, category: wineInfo.category }}
      />
    </div>
  );
}
