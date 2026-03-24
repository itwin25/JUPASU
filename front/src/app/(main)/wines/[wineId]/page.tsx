'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Heart, MoreHorizontal, PenSquare, Star, X } from 'lucide-react'; // ⭐️ X 아이콘 추가
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ReviewModal } from '@/features/review/components';
import {
  useWineScrapListQuery,
  useWineScrapMutation,
} from '@/features/wine/hooks/useWineListQuery';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

import {
  useWineReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} from '@/features/review/hooks/useWineReviewsQuery';

const DEFAULT_WINE_IMAGE_URL = '/default_wine.png';

type ReviewItem = {
  id: number;
  user: string;
  rating: number;
  content: string;
  date: string;
  avatar: string;
};

type SimilarWine = {
  id: number;
  name: string;
  desc: string;
  price: string;
  match: number;
};

type TasteProfile = {
  body: number;
  sweet: number;
  acid: number;
  tannin: number;
  alcoholDegree?: number;
};

type RatingDistribution = {
  star5: number;
  star4: number;
  star3: number;
  star2: number;
  star1: number;
};

type WineInfo = {
  id: number;
  name: string;
  category: string;
  country: string;
  flagUrl: string | null;
  match: number;
  rating: string;
  reviewCount: number;
  ratingDistribution: RatingDistribution;
  price: string;
  description: string;
  tasteProfile: TasteProfile;
  alcoholDegree: number;
  reason: string | null;
  tasteGroups: string[];
  foods: string[];
  similarWines: SimilarWine[];
  imageUrl: string;
  userPreference: TasteProfile | null;
};

const getCountryFlagUrl = (countryName: string | undefined | null) => {
  if (!countryName) return null;
  const name = countryName.trim().toLowerCase();

  let code = null;
  if (name.includes('프랑스') || name.includes('france') || name === 'fr') code = 'fr';
  else if (name.includes('이탈리아') || name.includes('italy') || name === 'it') code = 'it';
  else if (name.includes('스페인') || name.includes('spain') || name === 'es') code = 'es';
  else if (name.includes('미국') || name.includes('usa') || name.includes('united states') || name === 'us') code = 'us';
  else if (name.includes('칠레') || name.includes('chile') || name === 'cl') code = 'cl';
  else if (name.includes('호주') || name.includes('australia') || name === 'au') code = 'au';
  else if (name.includes('아르헨티나') || name.includes('argentina') || name === 'ar') code = 'ar';
  else if (name.includes('독일') || name.includes('germany') || name === 'de') code = 'de';
  else if (name.includes('뉴질랜드') || name.includes('new zealand') || name === 'nz') code = 'nz';
  else if (name.includes('포르투갈') || name.includes('portugal') || name === 'pt') code = 'pt';
  else if (name.includes('남아공') || name.includes('south africa') || name === 'za') code = 'za';
  else if (name.includes('한국') || name.includes('korea') || name.includes('대한민국') || name === 'kr') code = 'kr';

  return code ? `https://flagcdn.com/w40/${code}.png` : null;
};

const parseDateStr = (dateVal: any) => {
  if (!dateVal) return 0;
  if (Array.isArray(dateVal)) {
    return new Date(
      dateVal[0],
      dateVal[1] - 1,
      dateVal[2],
      dateVal[3] || 0,
      dateVal[4] || 0,
      dateVal[5] || 0,
    ).getTime();
  }
  return new Date(dateVal).getTime();
};

const formatDateStr = (dateVal: any) => {
  if (!dateVal) return '';
  let d: Date;
  if (Array.isArray(dateVal)) {
    d = new Date(dateVal[0], dateVal[1] - 1, dateVal[2], dateVal[3] || 0, dateVal[4] || 0);
  } else {
    d = new Date(dateVal);
  }
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

export default function WineDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ wineId: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();

  const numericWineId = Number(params.wineId);

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

  // ⭐️ 툴팁 가시성 상태 관리 추가
  const [showTasteTooltip, setShowTasteTooltip] = useState(false);

  const {
    data: wineDetail,
    isLoading: isWineLoading,
    refetch: refetchWineDetail,
  } = useQuery({
    queryKey: ['wine-detail', numericWineId],
    queryFn: () => api.get(`/wines/${numericWineId}`).then((res) => res.data.data),
  });

  const {
    data: reviewData,
    refetch: refetchReviews,
  } = useWineReviewsQuery(numericWineId);

  const createReviewMutation = useCreateReviewMutation();
  const updateReviewMutation = useUpdateReviewMutation();
  const deleteReviewMutation = useDeleteReviewMutation();

  const safeReviewList = useMemo<any[]>(() => {
    if (!reviewData) return [];
    const data = reviewData as any;
    return Array.isArray(data) ? data : (data.content || []);
  }, [reviewData]);

  const { data: scrapListData } = useWineScrapListQuery();
  const wineScrapMutation = useWineScrapMutation();

  const isScraped = useMemo(
    () =>
      (scrapListData ?? []).some(
        (item) => item.wineId === numericWineId || item.scrapId === numericWineId,
      ),
    [scrapListData, numericWineId],
  );

  const wineInfo = useMemo<WineInfo | null>(() => {
    if (!wineDetail) return null;

    return {
      id: wineDetail.wineId,
      name: wineDetail.nameKr || wineDetail.nameEn || '이름 없는 와인',
      category: wineDetail.grapeVariety || 'WINE',
      country: wineDetail.country || '원산지 미상',
      flagUrl: getCountryFlagUrl(wineDetail.country),
      match: wineDetail.matchRate || 0,
      rating: Number(wineDetail.averageRating || 0).toFixed(1),
      reviewCount: Number(wineDetail.reviewCount || 0),
      ratingDistribution: {
        star5: Number(wineDetail.star5Count || 0),
        star4: Number(wineDetail.star4Count || 0),
        star3: Number(wineDetail.star3Count || 0),
        star2: Number(wineDetail.star2Count || 0),
        star1: Number(wineDetail.star1Count || 0),
      },
      price: wineDetail.price ? wineDetail.price.toLocaleString() : '-',
      description: wineDetail.description || '와인에 대한 상세 설명이 없습니다.',
      tasteProfile: {
        body: wineDetail.body || 0,
        sweet: wineDetail.sweetness || 0,
        acid: wineDetail.acidity || 0,
        tannin: wineDetail.tannin || 0,
      },
      alcoholDegree: wineDetail.alcoholDegree || 0,
      reason: null,
      tasteGroups: (wineDetail.tasteGroups || []) as string[],
      foods: (wineDetail.pairingFoods || []) as string[],
      similarWines: [],
      imageUrl: wineDetail.imageUrl,
      userPreference: wineDetail.userPreference
        ? {
            tannin: wineDetail.userPreference.tannin || 0,
            body: wineDetail.userPreference.body || 0,
            alcoholDegree: wineDetail.userPreference.alcoholDegree || 0,
            sweet: wineDetail.userPreference.sweetness || 0,
            acid: wineDetail.userPreference.acidity || 0,
          }
        : null,
    };
  }, [wineDetail]);

  const reviews: ReviewItem[] = useMemo(() => {
    let sortedReviews = [...safeReviewList];
    if (sortOrder === 'rating') {
      sortedReviews.sort((a, b) => b.rating - a.rating);
    } else {
      sortedReviews.sort((a, b) => parseDateStr(b.createdAt) - parseDateStr(a.createdAt));
    }

    return sortedReviews.map((r) => ({
      id: r.id || r.reviewId,
      user: r.userNickname || r.nickname || '익명',
      rating: r.rating,
      content: r.content,
      date: formatDateStr(r.createdAt),
      avatar: '🍷',
    }));
  }, [safeReviewList, sortOrder]);

  const ratingBarTotal = useMemo(() => {
    if (!wineInfo) return 0;
    const d = wineInfo.ratingDistribution;
    return d.star5 + d.star4 + d.star3 + d.star2 + d.star1;
  }, [wineInfo]);

  const getRatingBarWidth = (count: number) => {
    if (ratingBarTotal === 0) return '0%';
    return `${(count / ratingBarTotal) * 100}%`;
  };

  const summaryStarCount = useMemo(() => {
    if (!wineInfo) return 0;
    return Math.max(0, Math.min(5, Math.round(Number(wineInfo.rating))));
  }, [wineInfo]);

  const dynamicPolygonPoints = useMemo(() => {
    if (!wineInfo) return '';
    const tasteValues = [
      wineInfo.tasteProfile.tannin,
      wineInfo.tasteProfile.body,
      Math.min((wineInfo.alcoholDegree / 20) * 5, 5),
      wineInfo.tasteProfile.sweet,
      wineInfo.tasteProfile.acid,
    ];

    return tasteValues
      .map((val, i) => {
        const radius = (val / 5) * 40;
        const angle = (i * 72 - 90) * (Math.PI / 180);
        return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
      })
      .join(' ');
  }, [wineInfo]);

  const userPolygonPoints = useMemo(() => {
    if (!wineInfo || !wineInfo.userPreference) return '';

    const pref = wineInfo.userPreference;
    const tasteValues = [
      pref.tannin,
      pref.body,
      Math.min((pref.alcoholDegree! / 20) * 5, 5),
      pref.sweet,
      pref.acid,
    ];

    return tasteValues
      .map((val, i) => {
        const radius = (val / 5) * 40;
        const angle = (i * 72 - 90) * (Math.PI / 180);
        return `${50 + radius * Math.cos(angle)},${50 + radius * Math.sin(angle)}`;
      })
      .join(' ');
  }, [wineInfo]);

  const handleOpenWriteModal = () => {
    setEditingReview(null);
    setIsReviewModalOpen(true);
  };

  const handleOpenEditModal = (review: { id: number; rating: number; content: string }) => {
    setEditingReview(review);
    setActiveMenuId(null);
    setIsReviewModalOpen(true);
  };

  const refreshAllReviewData = async () => {
    await Promise.all([refetchWineDetail(), refetchReviews()]);
  };

  const handleReviewSubmit = (data: { rating: number; content: string }) => {
    if (editingReview) {
      updateReviewMutation.mutate(
        {
          wineId: numericWineId,
          reviewId: editingReview.id,
          rating: data.rating,
          content: data.content,
        },
        {
          onSuccess: async () => {
            await refreshAllReviewData();
            setIsReviewModalOpen(false);
            setEditingReview(null);
          },
          onError: () => {
            alert('리뷰 수정 중 오류가 발생했습니다.');
          },
        },
      );
    } else {
      createReviewMutation.mutate(
        {
          wineId: numericWineId,
          rating: data.rating,
          content: data.content,
        },
        {
          onSuccess: async () => {
            await refreshAllReviewData();
            setIsReviewModalOpen(false);
          },
          onError: (error: any) => {
            if (error?.response?.status === 409) {
              alert('이미 이 와인에 대한 리뷰를 작성하셨습니다.');
            } else {
              alert('리뷰 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
          },
        },
      );
    }
  };

  const handleReviewDelete = (reviewId?: number) => {
    const targetId = reviewId || editingReview?.id;
    if (!targetId) return;

    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteReviewMutation.mutate(
        {
          wineId: numericWineId,
          reviewId: targetId,
        },
        {
          onSuccess: async () => {
            await refreshAllReviewData();
            setIsReviewModalOpen(false);
            setEditingReview(null);
            setActiveMenuId(null);
          },
          onError: () => {
            alert('리뷰 삭제 중 오류가 발생했습니다.');
          },
        },
      );
    }
  };

  const handleScrapClick = async () => {
    try {
      if (wineInfo?.id) {
        await wineScrapMutation.mutateAsync(wineInfo.id);
      }
    } catch (error) {
      console.error('Failed to toggle wine scrap', error);
    }
  };

  if (isWineLoading || !wineInfo) {
    return (
      <div className="bg-background min-h-screen pb-28 flex items-center justify-center font-bold text-text-main/40">
        와인 정보를 불러오는 중입니다...
      </div>
    );
  }

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
                <img
                  src={
                    wineInfo.imageUrl && wineInfo.imageUrl !== '/default_wine.png'
                      ? wineInfo.imageUrl
                      : DEFAULT_WINE_IMAGE_URL
                  }
                  alt={wineInfo.name}
                  className="w-full h-full object-contain p-4 drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_WINE_IMAGE_URL;
                    e.currentTarget.onerror = null;
                  }}
                />
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
                  <h1 className="text-text-main break-words text-[1.4rem] leading-[1.12] font-black tracking-[-0.035em]">
                    {wineInfo.name}
                  </h1>
                </div>
                <span className="text-text-main pt-2 text-[0.8rem] font-black tracking-[0.02em]">
                  {wineInfo.flagUrl ? (
                    <img
                      src={wineInfo.flagUrl}
                      alt={wineInfo.country}
                      className="h-4 rounded-[2px] shadow-sm inline-block"
                    />
                  ) : (
                    <span className="text-[1.1rem]">🍷</span>
                  )}
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

              {wineInfo.reason && (
                <div className="rounded-[1.6rem] border border-[#F2C9CC] bg-[#F9E8E9] px-4 py-3">
                  <div className="text-[0.88rem] font-black text-[#C96D72]">AI 추천 이유</div>
                  <p className="text-text-main/62 mt-1.5 text-[0.9rem] leading-relaxed font-medium">
                    {wineInfo.reason}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="mt-7">
            <div className="rounded-[1.3rem] bg-[#ECE4D8] p-1">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'rounded-[1rem] py-2.5 text-[0.88rem] font-black transition-all',
                    activeTab === 'info' ? 'text-text-main bg-white shadow-sm' : 'text-text-main/42',
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
                <div className="flex items-center justify-between relative">
                  <h3 className="text-text-main text-[1.05rem] font-black">맛 프로필</h3>
                  
                  {/* ⭐️ '?' 버튼을 버튼 태그로 변경하고 토글 이벤트 추가 */}
                  <button
                    onClick={() => setShowTasteTooltip(!showTasteTooltip)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C96D72] text-[0.68rem] font-black text-white hover:bg-[#b55b60] transition-colors focus:outline-none"
                    aria-label="맛 프로필 설명 보기"
                  >
                    ?
                  </button>

                  {/* ⭐️ 클릭 시 나타나는 툴팁 창 */}
                  {showTasteTooltip && (
                    <div className="absolute right-0 top-7 z-50 w-[15rem] rounded-[1rem] border border-primary-100 bg-white p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[0.8rem] font-black text-text-main">지표 설명</span>
                        <button onClick={() => setShowTasteTooltip(false)} className="p-1 text-text-main/40 hover:text-text-main">
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-2 text-[0.75rem] font-medium text-text-main/80">
                        <p><span className="font-bold text-[#C96D72]">BODY (바디):</span> 와인이 입안에서 느껴지는 무게감이나 점성입니다.</p>
                        <p><span className="font-bold text-[#C96D72]">SWEET (당도):</span> 와인에 남아있는 잔당으로 인한 단맛의 정도입니다.</p>
                        <p><span className="font-bold text-[#C96D72]">ACID (산미):</span> 입에 침이 고이게 만드는 신맛의 강도입니다.</p>
                        <p><span className="font-bold text-[#C96D72]">TANNIN (탄닌):</span> 포도 껍질과 씨에서 나오는 떫은맛과 쌉쌀함입니다.</p>
                      </div>
                      {/* 말풍선 꼬리 */}
                      <div className="absolute -top-2 right-2 h-4 w-4 rotate-45 border-l border-t border-primary-100 bg-white" />
                    </div>
                  )}
                </div>

                <div className="border-primary-100 rounded-[1.5rem] border bg-white px-4 py-4 shadow-[0_8px_20px_rgba(51,34,17,0.035)]">
                  {[
                    ['BODY', wineInfo.tasteProfile.body],
                    ['SWEET', wineInfo.tasteProfile.sweet],
                    ['ACID', wineInfo.tasteProfile.acid],
                    ['TANNIN', wineInfo.tasteProfile.tannin],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                    >
                      <span className="text-text-main/58 text-[0.82rem] font-black">
                        {label as string}
                      </span>
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

                {wineInfo.tasteGroups.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {wineInfo.tasteGroups.map((group, index) => (
                      <div
                        key={group}
                        className={cn(
                          'rounded-full px-4 py-2 text-[0.76rem] font-black',
                          index === 0 || index === wineInfo.tasteGroups.length - 1
                            ? 'bg-[#C96D72] text-white'
                            : 'text-text-main/62 bg-[#EFE8DD]',
                        )}
                      >
                        {group}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-text-main text-[1.05rem] font-black">취향 그래프</h3>

                  {wineInfo.userPreference && (
                    <div className="flex items-center gap-2 pr-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#D9AD70]"></div>
                        <span className="text-text-main/50 text-[0.68rem] font-bold">내 취향</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C96D72]"></div>
                        <span className="text-text-main/50 text-[0.68rem] font-bold">와인</span>
                      </div>
                    </div>
                  )}
                </div>

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

                      {userPolygonPoints && (
                        <polygon
                          points={userPolygonPoints}
                          className="fill-[#D9AD70]/30 stroke-[#D9AD70] stroke-[1.5]"
                        />
                      )}

                      <polygon
                        points={dynamicPolygonPoints}
                        className="fill-[#C96D72]/40 stroke-[#D86E73] stroke-[1.5]"
                      />
                    </svg>

                    <span className="text-text-main/60 absolute top-[-0.3rem] left-1/2 -translate-x-1/2 text-[0.8rem] font-bold">
                      탄닌
                    </span>
                    <span className="text-text-main/60 absolute top-[32%] right-[0.2rem] text-[0.8rem] font-bold">
                      바디
                    </span>
                    <span className="text-text-main/60 absolute right-[2.5rem] bottom-[2%] text-[0.8rem] font-bold">
                      도수
                    </span>
                    <span className="text-text-main/60 absolute bottom-[2%] left-[3.5rem] -translate-x-1/2 text-[0.8rem] font-bold">
                      당도
                    </span>
                    <span className="text-text-main/60 absolute top-[32%] left-[0.2rem] text-[0.8rem] font-bold">
                      산미
                    </span>
                  </div>
                </div>
              </div>

              {wineInfo.foods.length > 0 && (
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
              )}

              {wineInfo.similarWines.length > 0 && (
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
              )}
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
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < summaryStarCount ? '#FF9A3D' : 'currentColor'}
                          className={i < summaryStarCount ? 'text-[#FF9A3D]' : 'text-primary-100'}
                        />
                      ))}
                    </div>
                    <span className="text-text-main/34 mt-1 text-[0.72rem] font-semibold">
                      {wineInfo.reviewCount}개의 리뷰
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    {[
                      { level: 5, count: wineInfo.ratingDistribution.star5 },
                      { level: 4, count: wineInfo.ratingDistribution.star4 },
                      { level: 3, count: wineInfo.ratingDistribution.star3 },
                      { level: 2, count: wineInfo.ratingDistribution.star2 },
                      { level: 1, count: wineInfo.ratingDistribution.star1 },
                    ].map(({ level, count }) => (
                      <div key={level} className="flex items-center gap-2.5">
                        <span className="text-text-main/34 w-2 text-[0.68rem] font-semibold">
                          {level}
                        </span>
                        <div className="bg-primary-100 h-1.5 flex-1 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full bg-[#D9AD70]"
                            style={{ width: getRatingBarWidth(count) }}
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
                {reviews.length > 0 ? (
                  reviews.map((review) => (
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
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={12}
                                  fill={star <= review.rating ? '#FF9A3D' : 'none'}
                                  className={star <= review.rating ? 'text-[#FF9A3D]' : 'text-primary-100'}
                                />
                              ))}
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
                              <button
                                onClick={() => handleReviewDelete(review.id)}
                                className="w-full rounded-[0.7rem] py-2 text-center text-[0.7rem] font-black text-red-400 hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-text-main/68 mt-4 text-[0.9rem] leading-[1.7] font-medium whitespace-pre-wrap">
                        {review.content}
                      </p>

                      <div className="text-text-main/28 mt-4 text-right text-[0.68rem] font-semibold">
                        {review.date}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-text-main/40 font-bold text-sm">
                    최근에 작성된 리뷰가 없습니다.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <ReviewModal
        key={`${isReviewModalOpen}-${editingReview?.id ?? 'new'}`}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setEditingReview(null);
        }}
        onSubmit={handleReviewSubmit}
        onDelete={() => handleReviewDelete()}
        initialData={
          editingReview
            ? { rating: editingReview.rating, content: editingReview.content }
            : undefined
        }
        wineInfo={{
          id: wineInfo.id,
          name: wineInfo.name,
          category: wineInfo.category,
          image: wineInfo.imageUrl,
        }}
      />
    </div>
  );
}