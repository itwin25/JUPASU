'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUserMyPage } from '@/features/user/hooks/useUserMyPage';
import { useSearchUsersQuery } from '@/features/user/hooks/useUserQueries';
import { useTasteReportQuery } from '@/features/report/hooks/useTasteReportQuery';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MoreHorizontal,
  Search,
  Settings,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import Modal from '@/components/ui/modal/Modal';
import Button from '@/components/ui/button/Button';
import { useSignout } from '@/features/auth/hooks';
import {
  useDeleteFriendMutation,
  useFriendListQuery,
  useInviteFriendMutation,
  usePendingFriendListQuery,
  useRespondFriendRequestMutation,
} from '@/features/friend/hooks/useFriendQueries';
import {
  useDeleteReviewMutation,
  useMyReviewsQuery,
  useUpdateReviewMutation,
} from '@/features/review/hooks/useWineReviewsQuery';
import { ReviewModal } from '@/features/review/components';
import {
  useWineScrapListQuery,
  useWineScrapMutation,
} from '@/features/wine/hooks/useWineListQuery';
import { cn } from '@/lib/utils';
import type { UserMyPageResponse, UserSearchResponse } from '@/types/user.types';

type ReviewItem = {
  id: number;
  wineId?: number;
  wineName: string;
  rating: number;
  content: string;
  date: string;
  wineImageUrl?: string;
};

type WishlistItem = {
  id: number;
  wineId?: number;
  scrapId?: number;
  name: string;
  subtitle: string;
  rating: number;
  price: string;
  countryFlag: string;
  match: string;
  imageUrl?: string;
};

type FriendItem = {
  id: number;
  requestId?: number;
  friendId?: number;
  name: string;
  winesTasted: number;
  avatar: string;
};

const PAGE_SIZE = 3;
const DEFAULT_WINE_IMAGE_URL = '/default_wine.png';

const modalClassName =
  'w-[calc(100vw-1rem)] max-w-[20.5rem] rounded-[1.7rem] bg-[#F7F5F1] px-3.5 py-4 sm:max-w-[21.5rem] sm:px-4';

function getCharacterBase(character?: string) {
  if (!character) return 'tiger';

  return character
    .replace(/^\//, '')
    .replace(/\.svg$/i, '')
    .replace(/[1-3]$/, '');
}

function getCharacterStage(reviewCount: number) {
  if (reviewCount >= 10) return 3;
  if (reviewCount >= 5) return 2;
  return 1;
}

function resolveCharacterImage(character?: string, reviewCount: number = 0) {
  const base = getCharacterBase(character);
  const stage = getCharacterStage(reviewCount);
  return `/${base}${stage}.svg`;
}

function getCountryCode(country?: string) {
  switch (country?.toLowerCase()) {
    case 'france':
      return 'FR';
    case 'italy':
      return 'IT';
    case 'spain':
      return 'ES';
    case 'new zealand':
      return 'NZ';
    case 'usa':
    case 'united states':
      return 'US';
    case 'chile':
      return 'CL';
    case 'argentina':
      return 'AR';
    case 'australia':
      return 'AU';
    default:
      return country?.slice(0, 2).toUpperCase() ?? '--';
  }
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index);

  return (
    <div className="text-text-main/45 flex items-center justify-center gap-3 pt-5 text-xs">
      <button
        className={cn(currentPage === 0 ? 'text-text-main/20' : 'text-text-main')}
        onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
            page === currentPage ? 'bg-[#B17672] text-white' : 'text-text-main/45',
          )}
        >
          {page + 1}
        </button>
      ))}

      <button
        className={cn(currentPage === totalPages - 1 ? 'text-text-main/20' : 'text-text-main')}
        onClick={() => currentPage < totalPages - 1 && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

function calculateRadarPoint(
  value: number,
  maxVal: number,
  maxXY: [number, number],
  centerXY = 120,
) {
  const scaledValue = Math.min(Math.max(value, 0), maxVal);
  const ratio = scaledValue / maxVal;

  const [maxX, maxY] = maxXY;
  const x = centerXY + (maxX - centerXY) * ratio;
  const y = centerXY + (maxY - centerXY) * ratio;

  return `${x},${y}`;
}

export default function MyPage() {
  const { data: profile, isLoading }: { data: UserMyPageResponse | undefined; isLoading: boolean } =
    useUserMyPage();

  const { data: friendListData } = useFriendListQuery();
  const { data: pendingFriendListData } = usePendingFriendListQuery();
  const { data: tasteReport, isLoading: isReportLoading } = useTasteReportQuery();

  const [wishlistPage, setWishlistPage] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);

  const { data: myReviewsPageData } = useMyReviewsQuery(reviewPage);
  const { data: scrapListPageData } = useWineScrapListQuery(wishlistPage);

  const myReviews = myReviewsPageData?.content ?? [];
  const scrapList = scrapListPageData?.content ?? [];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBestOpen, setIsBestOpen] = useState(true);
  const [isWorstOpen, setIsWorstOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<
    'wishlist' | 'reviews' | 'friends' | 'terms' | null
  >(null);
  const [friendTab, setFriendTab] = useState<'list' | 'search' | 'requests'>('list');
  const [activeReviewMenuId, setActiveReviewMenuId] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const {
    data: searchResults = [],
    isFetching: isSearching,
  }: {
    data: UserSearchResponse[] | undefined;
    isFetching: boolean;
  } = useSearchUsersQuery(friendSearchQuery);

  const [reviewOverrides, setReviewOverrides] = useState<
    Record<number, Pick<ReviewItem, 'content' | 'rating'>>
  >({});
  const [deletedReviewIds, setDeletedReviewIds] = useState<number[]>([]);
  const [removedWishlistWineIds, setRemovedWishlistWineIds] = useState<number[]>([]);
  const [removedFriendIds, setRemovedFriendIds] = useState<number[]>([]);
  const [removedPendingRequestIds, setRemovedPendingRequestIds] = useState<number[]>([]);
  const [optimisticAcceptedFriends, setOptimisticAcceptedFriends] = useState<FriendItem[]>([]);
  const [sentInviteIds, setSentInviteIds] = useState<number[]>([]);

  const { handleSignout } = useSignout();
  const inviteFriendMutation = useInviteFriendMutation();
  const respondFriendRequestMutation = useRespondFriendRequestMutation();
  const deleteFriendMutation = useDeleteFriendMutation();
  const updateReviewMutation = useUpdateReviewMutation();
  const deleteReviewMutation = useDeleteReviewMutation();
  const wineScrapMutation = useWineScrapMutation();

  const wishlistItems = useMemo<WishlistItem[]>(
    () =>
      scrapList.map((item) => ({
        id: item.scrapId,
        wineId: item.wineId,
        scrapId: item.scrapId,
        name: item.wineName,
        subtitle: item.wineType,
        rating: Number(item.averageRating ?? 0),
        price: `₩${item.price.toLocaleString('ko-KR')}`,
        countryFlag: getCountryCode(item.country),
        match: `${item.matchRate}%`,
        imageUrl: item.imageUrl || DEFAULT_WINE_IMAGE_URL,
      })),
    [scrapList],
  );

  const visibleWishlistItems = useMemo(
    () =>
      wishlistItems.filter(
        (item) => item.wineId == null || !removedWishlistWineIds.includes(item.wineId),
      ),
    [wishlistItems, removedWishlistWineIds],
  );

  const mappedReviews = useMemo<ReviewItem[]>(
    () =>
      myReviews.map((review) => {
        const override = reviewOverrides[review.reviewId];
        const createdDate = new Date(review.createdAt);

        return {
          id: review.reviewId,
          wineId: review.wineId,
          wineName: review.wineName,
          rating: override?.rating ?? review.rating,
          content: override?.content ?? review.content,
          date: Number.isNaN(createdDate.getTime())
            ? ''
            : createdDate.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, ''),
          wineImageUrl: review.wineImageUrl || DEFAULT_WINE_IMAGE_URL,
        };
      }),
    [myReviews, reviewOverrides],
  );

  const visibleReviews = useMemo(
    () => mappedReviews.filter((review) => !deletedReviewIds.includes(review.id)),
    [mappedReviews, deletedReviewIds],
  );

  const editingReview = visibleReviews.find((review) => review.id === editingReviewId) ?? null;

  const baseFriends = useMemo<FriendItem[]>(
    () =>
      (friendListData ?? []).map((friend) => ({
        id: friend.friendId,
        requestId: friend.requestId,
        friendId: friend.friendId,
        name: friend.nickname,
        winesTasted: friend.reviewCount,
        avatar: resolveCharacterImage(friend.character, friend.reviewCount ?? 0),
      })),
    [friendListData],
  );

  const visibleFriends = useMemo<FriendItem[]>(() => {
    const merged = [...optimisticAcceptedFriends, ...baseFriends];
    const seen = new Set<number>();

    return merged.filter((friend) => {
      const key = friend.friendId ?? friend.id;
      if (removedFriendIds.includes(key)) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [baseFriends, optimisticAcceptedFriends, removedFriendIds]);

  const basePendingFriends = useMemo<FriendItem[]>(
    () =>
      (pendingFriendListData ?? []).map((friend) => ({
        id: friend.requesterId,
        requestId: friend.requestId,
        friendId: friend.requesterId,
        name: friend.nickname,
        winesTasted: friend.reviewCount,
        avatar: resolveCharacterImage(friend.character, friend.reviewCount ?? 0),
      })),
    [pendingFriendListData],
  );

  const visiblePendingFriends = useMemo<FriendItem[]>(
    () =>
      basePendingFriends.filter(
        (friend) =>
          friend.requestId == null || !removedPendingRequestIds.includes(friend.requestId),
      ),
    [basePendingFriends, removedPendingRequestIds],
  );

  const serverWishlistTotalCount = scrapListPageData?.totalElements ?? profile?.wishlistCount ?? 0;
  const serverReviewTotalCount = myReviewsPageData?.totalElements ?? profile?.reviewCount ?? 0;

  const currentWishlistCount = Math.max(
    0,
    serverWishlistTotalCount - removedWishlistWineIds.length,
  );
  const currentReviewCount = Math.max(0, serverReviewTotalCount - deletedReviewIds.length);
  const currentFriendCount =
    friendListData !== undefined ? visibleFriends.length : (profile?.friendCount ?? 0);

  const wishlistTotalPages = Math.max(1, Math.ceil(currentWishlistCount / PAGE_SIZE));
  const reviewTotalPages = Math.max(1, Math.ceil(currentReviewCount / PAGE_SIZE));

  const currentStage = Math.min(Math.floor(currentReviewCount / 5) + 1, 3);
  const progressInStage = currentStage === 3 ? 5 : currentReviewCount % 5;
  const progressPercentage = (progressInStage / 5) * 100;

  const handleLogout = () => {
    handleSignout();
  };

  const openReviewEditModal = (review: ReviewItem) => {
    setActiveReviewMenuId(null);
    setEditingReviewId(review.id);
  };

  const closeReviewEditModal = () => {
    setEditingReviewId(null);
  };

  const deleteReview = async () => {
    if (deletingReviewId === null) return;

    const deletingReview = visibleReviews.find((review) => review.id === deletingReviewId) ?? null;
    if (!deletingReview?.wineId) return;

    await deleteReviewMutation.mutateAsync({
      wineId: deletingReview.wineId,
      reviewId: deletingReview.id,
    });

    setDeletedReviewIds((prev) =>
      prev.includes(deletingReview.id) ? prev : [...prev, deletingReview.id],
    );

    setReviewOverrides((prev) => {
      const next = { ...prev };
      delete next[deletingReview.id];
      return next;
    });

    const nextTotalCount = Math.max(0, currentReviewCount - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotalCount / PAGE_SIZE));

    if (reviewPage >= nextTotalPages && reviewPage > 0) {
      setReviewPage(reviewPage - 1);
    }

    setDeletingReviewId(null);
  };

  const handleInviteFriend = async (userId: number, nickname: string) => {
    await inviteFriendMutation.mutateAsync({
      receiverId: userId,
      receiverNickname: nickname,
    });

    setSentInviteIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const handleFriendRequestResponse = async (
    requestId: number | undefined,
    status: 'ACCEPTED' | 'REJECTED',
  ) => {
    if (!requestId) return;

    const target = visiblePendingFriends.find((friend) => friend.requestId === requestId);

    await respondFriendRequestMutation.mutateAsync({
      requestId,
      status,
    });

    setRemovedPendingRequestIds((prev) => (prev.includes(requestId) ? prev : [...prev, requestId]));

    if (status === 'ACCEPTED' && target) {
      setOptimisticAcceptedFriends((prev) => [
        {
          ...target,
          id: target.friendId ?? target.id,
        },
        ...prev,
      ]);
    }
  };

  const handleDeleteFriend = async (requestId: number | undefined) => {
    if (!requestId) return;

    const target = visibleFriends.find((friend) => friend.requestId === requestId);

    await deleteFriendMutation.mutateAsync(requestId);

    if (target) {
      const friendKey = target.friendId ?? target.id;

      setRemovedFriendIds((prev) => (prev.includes(friendKey) ? prev : [...prev, friendKey]));
      setOptimisticAcceptedFriends((prev) =>
        prev.filter((friend) => (friend.friendId ?? friend.id) !== friendKey),
      );
    }
  };

  const handleToggleWishlist = async (wineId: number | undefined) => {
    if (!wineId) return;

    await wineScrapMutation.mutateAsync(wineId);

    setRemovedWishlistWineIds((prev) => (prev.includes(wineId) ? prev : [...prev, wineId]));

    const nextTotalCount = Math.max(0, currentWishlistCount - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotalCount / PAGE_SIZE));

    if (wishlistPage >= nextTotalPages && wishlistPage > 0) {
      setWishlistPage(wishlistPage - 1);
    }
  };

  const radarChartPoints = useMemo(() => {
    if (!tasteReport?.radarChart) {
      return '120,45 191,97 164,181 76,181 49,97';
    }

    const radar = tasteReport.radarChart;
    const p1 = calculateRadarPoint(radar.tannin, 5, [120, 30]);
    const p2 = calculateRadarPoint(radar.acidity, 5, [195, 84]);
    const p3 = calculateRadarPoint(radar.body, 5, [166, 173]);
    const p4 = calculateRadarPoint(radar.sweetness, 5, [74, 173]);
    const p5 = calculateRadarPoint(radar.alcohol, 20, [45, 84]);

    return `${p1} ${p2} ${p3} ${p4} ${p5}`;
  }, [tasteReport]);

  return (
    <div className="bg-background min-h-screen pb-0">
      <header className="bg-background/85 sticky top-0 z-30 flex items-center justify-between px-5 py-5 backdrop-blur-md">
        <h1 className="text-text-main text-2xl font-black">My Page</h1>
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="text-text-main hover:bg-primary-100/30 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
        >
          {isMenuOpen ? <X size={24} /> : <Settings size={24} />}
        </button>

        {isMenuOpen && (
          <div className="border-primary-100 absolute top-[3.75rem] right-5 z-40 w-40 rounded-[1rem] border bg-white p-1 shadow-xl">
            <div className="flex flex-col">
              <Link
                href="/mypage/profile"
                className="hover:bg-primary-100/30 flex items-center rounded-[0.8rem] px-2.5 py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-text-main text-[13px] font-bold">프로필 수정</span>
              </Link>

              <Link
                href="/mypage/taste"
                className="hover:bg-primary-100/30 flex items-center rounded-[0.8rem] px-2.5 py-2 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-text-main text-[13px] font-bold">와인 취향 설정</span>
              </Link>

              <div className="bg-primary-100 mx-3 my-1 h-px" />

              <button
                onClick={handleLogout}
                className="flex items-center rounded-[0.8rem] px-2.5 py-2 text-red-500 transition-colors hover:bg-red-50"
              >
                <span className="text-[13px] font-bold">로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {isMenuOpen && <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />}

      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4">
        <section className="border-primary-100 rounded-[1.5rem] border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 relative h-16 w-16 overflow-hidden rounded-full">
              <Image
                src={resolveCharacterImage(profile?.character, currentReviewCount)}
                alt="프로필 이미지"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-text-main text-lg font-black">
                {isLoading ? '로딩 중...' : profile?.nickname || '사용자'}
              </h2>
              <p className="text-text-main/45 mt-1 text-sm font-medium">
                오늘도 취향을 한 잔씩 쌓는 중
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] bg-[#F9F7F2] p-3">
            <div className="relative h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#D65F69] to-[#B36262] transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="divide-primary-100 mt-4 grid grid-cols-3 divide-x">
            <button
              onClick={() => {
                setWishlistPage(0);
                setActiveModal('wishlist');
              }}
              className="py-2 text-center"
            >
              <p className="text-lg font-black text-[#B36262]">{currentWishlistCount}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">위시리스트</p>
            </button>

            <button
              onClick={() => {
                setReviewPage(0);
                setActiveModal('reviews');
              }}
              className="py-2 text-center"
            >
              <p className="text-lg font-black text-[#B36262]">{currentReviewCount}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">리뷰</p>
            </button>

            <button
              onClick={() => {
                setFriendTab('list');
                setActiveModal('friends');
              }}
              className="py-2 text-center"
            >
              <p className="text-lg font-black text-[#B36262]">{currentFriendCount}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">친구</p>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-text-main px-4 text-[1.2rem] font-black">AI 나의 취향 리포트</h3>

          <div className="border-primary-100 mt-3 rounded-[1.5rem] border bg-white p-4 shadow-sm">
            <div className="bg-white px-1 py-1">
              <p className="text-text-main text-center text-[11px] leading-relaxed font-black">
                {isReportLoading
                  ? '리포트를 불러오는 중이에요...'
                  : tasteReport?.mainTitle ||
                    "와인초보님은 '상큼하고 가벼운' 화이트 와인 취향이에요!"}
              </p>

              <div className="relative mx-auto mt-3 flex h-[250px] w-full max-w-[250px] items-center justify-center">
                <svg viewBox="0 0 240 240" className="h-full w-full">
                  <g stroke="#D9D4CF" strokeWidth="1.2" fill="none">
                    <polygon points="120,30 195,84 166,173 74,173 45,84" />
                    <polygon points="120,48 180,91 157,162 83,162 60,91" />
                    <polygon points="120,66 165,99 148,151 92,151 75,99" />
                    <polygon points="120,84 150,106 139,140 101,140 90,106" />
                    <polygon points="120,102 135,113 130,129 110,129 105,113" />
                    <line x1="120" y1="120" x2="120" y2="30" />
                    <line x1="120" y1="120" x2="195" y2="84" />
                    <line x1="120" y1="120" x2="166" y2="173" />
                    <line x1="120" y1="120" x2="74" y2="173" />
                    <line x1="120" y1="120" x2="45" y2="84" />
                  </g>
                  <polygon
                    points={radarChartPoints}
                    fill="rgba(196, 91, 91, 0.16)"
                    stroke="#C75B5B"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    className="transition-all duration-700 ease-in-out"
                  />
                </svg>

                <div className="absolute top-[-10px] left-1/2 flex -translate-x-1/2 flex-col items-center">
                  <span className="text-text-main/55 mb-0.5 text-[10px] leading-none font-medium">
                    탄닌
                  </span>
                  <span className="text-[10px] leading-none font-black text-[#C75B5B]">
                    {tasteReport?.radarChart?.tannin ?? 0}
                    <span className="text-text-main/40 text-[8px] font-medium">/5</span>
                  </span>
                </div>
                <div className="absolute top-[68px] right-[-10px] flex flex-col items-center">
                  <span className="text-text-main/55 mb-0.5 text-[10px] leading-none font-medium">
                    산미
                  </span>
                  <span className="text-[10px] leading-none font-black text-[#C75B5B]">
                    {tasteReport?.radarChart?.acidity ?? 0}
                    <span className="text-text-main/40 text-[8px] font-medium">/5</span>
                  </span>
                </div>
                <div className="absolute right-[22px] bottom-[20px] flex flex-col items-center">
                  <span className="text-text-main/55 mb-0.5 text-[10px] leading-none font-medium">
                    바디
                  </span>
                  <span className="text-[10px] leading-none font-black text-[#C75B5B]">
                    {tasteReport?.radarChart?.body ?? 0}
                    <span className="text-text-main/40 text-[8px] font-medium">/5</span>
                  </span>
                </div>
                <div className="absolute bottom-[20px] left-[22px] flex flex-col items-center">
                  <span className="text-text-main/55 mb-0.5 text-[10px] leading-none font-medium">
                    당도
                  </span>
                  <span className="text-[10px] leading-none font-black text-[#C75B5B]">
                    {tasteReport?.radarChart?.sweetness ?? 0}
                    <span className="text-text-main/40 text-[8px] font-medium">/5</span>
                  </span>
                </div>
                <div className="absolute top-[68px] left-[-10px] flex flex-col items-center">
                  <span className="text-text-main/55 mb-0.5 text-[10px] leading-none font-medium">
                    도수
                  </span>
                  <span className="text-[10px] leading-none font-black text-[#C75B5B]">
                    {tasteReport?.radarChart?.alcohol ?? 0}
                    <span className="text-text-main/40 text-[8px] font-medium">/20</span>
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal('terms')}
                  className="absolute right-[-10px] bottom-[16px] flex h-4 w-4 items-center justify-center rounded-full bg-[#A76B6B] text-[10px] font-bold text-white transition-transform hover:scale-110"
                >
                  ?
                </button>
              </div>

              <div className="mt-1 flex justify-center">
                <span className="rounded-full bg-[#F6EAE6] px-4 py-1.5 text-[10px] font-black text-[#C98674]">
                  {isReportLoading ? '데이터 분석 중' : tasteReport?.tasteTypeTag || '밸런스형'}
                </span>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#F6EAE6]">
                  <Image
                    src="/chatbot_profile.svg"
                    alt="챗봇 프로필"
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-text-main/80 text-[12px] leading-5 font-medium">
                  {isReportLoading
                    ? '분석 결과를 불러오는 중...'
                    : tasteReport?.content || '리포트 내용이 없습니다.'}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={() => setIsBestOpen((prev) => !prev)}
                  className="w-full rounded-[1rem] border border-[#E9D5D1] bg-white px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2 text-[#B17672]">
                    <span
                      className={cn(
                        'text-xs transition-transform',
                        isBestOpen ? 'rotate-0' : 'rotate-180',
                      )}
                    >
                      ⌃
                    </span>
                    <p className="text-[11px] font-black uppercase">Best</p>
                  </div>
                  {isBestOpen && (
                    <p className="text-text-main/65 mt-2 text-[11px] leading-5 font-medium">
                      {isReportLoading
                        ? '불러오는 중...'
                        : tasteReport?.bestDescription || 'Best 와인 설명이 없습니다.'}
                    </p>
                  )}
                </button>

                <button
                  onClick={() => setIsWorstOpen((prev) => !prev)}
                  className="w-full rounded-[1rem] border border-[#E9D5D1] bg-white px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2 text-[#B17672]">
                    <span
                      className={cn(
                        'text-xs transition-transform',
                        isWorstOpen ? 'rotate-0' : 'rotate-180',
                      )}
                    >
                      ⌃
                    </span>
                    <p className="text-[11px] font-black uppercase">Worst</p>
                  </div>
                  {isWorstOpen && (
                    <p className="text-text-main/65 mt-2 text-[11px] leading-5 font-medium">
                      {isReportLoading
                        ? '불러오는 중...'
                        : tasteReport?.worstDescription || 'Worst 와인 설명이 없습니다.'}
                    </p>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="와인 용어 설명"
        centerTitle
        hideDefaultFooter
        className={modalClassName}
      >
        <div className="bg-primary-100/80 mb-4 h-px" />
        <div className="text-text-main space-y-4 text-[13px] leading-relaxed">
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">탄닌 (Tannin)</h4>
            <p className="text-text-main/80 text-[12px]">
              입안을 마르게 하거나 떫은 맛을 내는 성분이에요. 주로 포도 껍질과 씨에서 나옵니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">산미 (Acidity)</h4>
            <p className="text-text-main/80 text-[12px]">
              포도의 산 성분으로 인해 느껴지는 신맛이에요. 와인에 상쾌함과 생기를 줍니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">바디 (Body)</h4>
            <p className="text-text-main/80 text-[12px]">
              입안에서 느껴지는 와인의 무게감이나 질감이에요. 물(가벼움)과 우유(무거움)의 차이와
              비슷해요.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">당도 (Sweetness)</h4>
            <p className="text-text-main/80 text-[12px]">
              와인에서 느껴지는 단맛이에요. 발효 후 남은 잔당의 양에 따라 결정됩니다.
            </p>
          </div>
          <div className="rounded-[1rem] border border-[#E9D5D1] bg-[#FBFAF7] p-3 shadow-sm">
            <h4 className="mb-1 font-black text-[#A76B6B]">도수 (Alcohol)</h4>
            <p className="text-text-main/80 text-[12px]">
              와인에 포함된 알코올의 비율이에요. 효모가 당을 분해하여 생성합니다.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'wishlist'}
        onClose={() => setActiveModal(null)}
        title="위시리스트"
        centerTitle
        hideDefaultFooter
        className={modalClassName}
      >
        <div className="bg-primary-100/80 mb-4 h-px" />

        {visibleWishlistItems.length > 0 ? (
          <>
            <div className="space-y-3">
              {visibleWishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-[#B97B79] bg-[#FBFAF7] p-2.5 shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    {item.wineId ? (
                      <Link
                        href={`/wines/${item.wineId}`}
                        onClick={() => setActiveModal(null)}
                        className="flex min-w-0 flex-1 items-center gap-2.5"
                      >
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[0.8rem] bg-[#E6E3DE]">
                          <img
                            src={item.imageUrl || DEFAULT_WINE_IMAGE_URL}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_WINE_IMAGE_URL;
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-text-main truncate text-sm font-black hover:underline">
                                {item.name}
                              </h4>
                              <p className="text-text-main/45 mt-0.5 text-[11px] font-medium">
                                {item.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 pt-0.5">
                              <span className="text-text-main/55 text-[10px] font-black">
                                {item.countryFlag}
                              </span>
                              <span className="text-[10px] font-black text-[#C87E7A]">
                                {item.match}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-[11px] font-black text-[#D89A4F]">
                              ★ {item.rating.toFixed(1)}
                            </span>
                            <span className="text-xs font-black text-[#CC5C57]">{item.price}</span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[0.8rem] bg-[#E6E3DE]">
                          <img
                            src={item.imageUrl || DEFAULT_WINE_IMAGE_URL}
                            alt={item.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_WINE_IMAGE_URL;
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-text-main truncate text-sm font-black">
                                {item.name}
                              </h4>
                              <p className="text-text-main/45 mt-0.5 text-[11px] font-medium">
                                {item.subtitle}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 pt-0.5">
                              <span className="text-text-main/55 text-[10px] font-black">
                                {item.countryFlag}
                              </span>
                              <span className="text-[10px] font-black text-[#C87E7A]">
                                {item.match}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-[11px] font-black text-[#D89A4F]">
                              ★ {item.rating.toFixed(1)}
                            </span>
                            <span className="text-xs font-black text-[#CC5C57]">{item.price}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleToggleWishlist(item.wineId)}
                      className="shrink-0 text-[#CC5C57]"
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={wishlistPage}
              totalPages={wishlistTotalPages}
              onPageChange={setWishlistPage}
            />
          </>
        ) : (
          <div className="text-text-main/50 py-10 text-center text-[13px] font-medium">
            위시리스트가 비어 있습니다.
          </div>
        )}
      </Modal>

      <Modal
        isOpen={activeModal === 'reviews'}
        onClose={() => {
          setActiveModal(null);
          setActiveReviewMenuId(null);
        }}
        title="내가 작성한 리뷰"
        centerTitle
        hideDefaultFooter
        className={modalClassName}
      >
        <div className="bg-primary-100/80 mb-4 h-px" />

        {visibleReviews.length > 0 ? (
          <>
            <div className="space-y-3">
              {visibleReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[1.25rem] border border-[#B97B79] bg-[#FBFAF7] p-2.5 shadow-sm"
                >
                  <div className="flex gap-2.5">
                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[0.8rem] bg-[#E6E3DE]">
                      <img
                        src={review.wineImageUrl || DEFAULT_WINE_IMAGE_URL}
                        alt={review.wineName}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_WINE_IMAGE_URL;
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <Link
                            href={`/wines/${review.wineId}`}
                            onClick={() => setActiveModal(null)}
                            className="text-text-main block truncate text-[13px] font-black hover:underline"
                          >
                            {review.wineName}
                          </Link>
                          <div className="mt-0.5 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= review.rating ? '#D89A4F' : '#E0DDD7'}
                                className={
                                  star <= review.rating ? 'text-[#D89A4F]' : 'text-[#E0DDD7]'
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className="relative shrink-0">
                          <button
                            onClick={() =>
                              setActiveReviewMenuId((prev) =>
                                prev === review.id ? null : review.id,
                              )
                            }
                            className="text-text-main rounded-full p-1"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeReviewMenuId === review.id && (
                            <div className="border-primary-100 absolute top-7 right-0 z-10 w-24 rounded-[0.9rem] border bg-white p-1 shadow-xl">
                              <button
                                onClick={() => openReviewEditModal(review)}
                                className="text-text-main hover:bg-primary-100/40 w-full rounded-xl px-2 py-1.5 text-center text-[10px] font-bold transition-colors"
                              >
                                수정하기
                              </button>
                              <button
                                onClick={() => {
                                  setActiveReviewMenuId(null);
                                  setDeletingReviewId(review.id);
                                }}
                                className="w-full rounded-xl px-2 py-1.5 text-center text-[10px] font-bold text-[#D65F69] transition-colors hover:bg-red-50"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-text-main mt-1.5 text-[12px] leading-relaxed font-medium">
                        {review.content || '작성한 리뷰 내용이 없습니다.'}
                      </p>
                      <div className="mt-1 flex justify-end">
                        <span className="text-[11px] font-medium text-[#B97B79]">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={reviewPage}
              totalPages={reviewTotalPages}
              onPageChange={setReviewPage}
            />
          </>
        ) : (
          <div className="text-text-main/50 py-10 text-center text-[13px] font-medium">
            작성한 리뷰가 없습니다.
          </div>
        )}
      </Modal>

      <ReviewModal
        key={`${editingReview?.id ?? 'closed'}-${editingReview?.rating ?? 0}-${editingReview?.content ?? ''}`}
        isOpen={editingReview !== null}
        onClose={closeReviewEditModal}
        onSubmit={async ({ rating, content }) => {
          if (!editingReview || rating === 0 || !editingReview.wineId) return;

          const normalizedContent = content.trim();

          await updateReviewMutation.mutateAsync({
            wineId: editingReview.wineId,
            reviewId: editingReview.id,
            rating,
            content: normalizedContent,
          });

          setReviewOverrides((prev) => ({
            ...prev,
            [editingReview.id]: {
              rating,
              content: normalizedContent,
            },
          }));

          closeReviewEditModal();
        }}
        initialData={
          editingReview
            ? {
                rating: editingReview.rating,
                content: editingReview.content,
              }
            : undefined
        }
        wineInfo={{
          id: editingReview?.wineId,
          name: editingReview?.wineName ?? '',
          category: '',
          image: editingReview?.wineImageUrl,
        }}
      />

      <Modal
        isOpen={deletingReviewId !== null}
        onClose={() => setDeletingReviewId(null)}
        title="리뷰 삭제"
        centerTitle
        className="w-[calc(100vw-2rem)] max-w-[18.5rem] rounded-[1.55rem] bg-[#F7F5F1] px-3.5 py-4"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="full"
              onClick={() => setDeletingReviewId(null)}
              className="rounded-[1rem]"
            >
              취소
            </Button>
            <Button
              size="full"
              onClick={deleteReview}
              className="rounded-[1rem] bg-[#D65F69] hover:bg-[#C44B56]"
            >
              삭제
            </Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F6EAEA] text-[#D65F69]">
            <Trash2 size={20} />
          </div>
          <p className="text-text-main/75 text-sm font-bold">삭제하시겠습니까?</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'friends'}
        onClose={() => setActiveModal(null)}
        title={
          friendTab === 'list' ? '친구 목록' : friendTab === 'search' ? '친구 검색' : '친구 요청'
        }
        centerTitle
        hideDefaultFooter
        className={modalClassName}
      >
        {friendTab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setFriendTab('requests')}
                className="rounded-full bg-[#C57070] px-3 py-1.5 text-[11px] font-black text-white"
              >
                친구 요청 ({visiblePendingFriends.length})
              </button>
            </div>

            <button
              onClick={() => setFriendTab('search')}
              className="flex w-full items-center justify-between rounded-[1.3rem] border border-[#E5D5D1] bg-[#F2ECEC] px-3.5 py-3.5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7E2DD] text-xl text-[#B17672]">
                  +
                </div>
                <div>
                  <p className="text-text-main text-sm font-black">친구 추가하기</p>
                  <p className="text-text-main/40 mt-0.5 text-[11px] font-medium">
                    닉네임이나 코드로 검색해 보세요
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#B17672]" />
            </button>

            <div>
              <p className="text-text-main/45 mb-3 text-sm font-medium">
                친구 {visibleFriends.length}명
              </p>
              <div className="max-h-[18rem] space-y-2.5 overflow-y-auto pr-1">
                {visibleFriends.length > 0 ? (
                  visibleFriends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between rounded-[1.2rem] border border-[#DDD4C8] bg-[#FBFAF7] px-3.5 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8E5A45]">
                          <Image
                            src={friend.avatar}
                            alt={friend.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-text-main text-[13px] font-black">{friend.name}</p>
                          <p className="text-text-main/45 text-[11px] font-medium">
                            {friend.winesTasted ?? 0}종 시음
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <button
                          onClick={() => handleDeleteFriend(friend.requestId)}
                          className="text-text-main/55 rounded-full bg-[#E8E5E0] px-3 py-1 text-[10px] font-black"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-text-main/50 py-8 text-center text-[13px] font-medium">
                    친구 목록이 비어 있습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {friendTab === 'requests' && (
          <div className="space-y-2.5">
            {visiblePendingFriends.length > 0 ? (
              visiblePendingFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[#DDD4C8] bg-[#FBFAF7] px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8E5A45]">
                      <Image src={friend.avatar} alt={friend.name} fill className="object-cover" />
                    </div>
                    <p className="text-text-main text-[13px] font-black">{friend.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFriendRequestResponse(friend.requestId, 'ACCEPTED')}
                      className="rounded-full bg-[#F6EAEA] px-3 py-1 text-[10px] font-black text-[#B17672]"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleFriendRequestResponse(friend.requestId, 'REJECTED')}
                      className="text-text-main/55 rounded-full bg-[#E8E5E0] px-3 py-1 text-[10px] font-black"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-text-main/50 py-8 text-center text-[13px] font-medium">
                받은 친구 요청이 없습니다.
              </div>
            )}
          </div>
        )}

        {friendTab === 'search' && (
          <div className="space-y-3.5">
            <div className="relative">
              <input
                value={friendSearchQuery}
                onChange={(event) => setFriendSearchQuery(event.target.value)}
                placeholder="친구 ID 입력..."
                className="text-text-main placeholder:text-text-main/35 h-11 w-full rounded-full border border-[#DDD4C8] bg-[#FBFAF7] pr-12 pl-4 text-[13px] font-medium outline-none"
              />
              <button className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#B17672] text-white">
                <Search size={16} />
              </button>
            </div>

            <div className="max-h-[50vh] space-y-2.5 overflow-y-auto pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((f: UserSearchResponse) => {
                  const isInvitedLocally = sentInviteIds.includes(f.userId);
                  const displayStatus = isInvitedLocally ? 'PENDING' : f.friendStatus;

                  return (
                    <div
                      key={f.userId}
                      className="flex items-center justify-between rounded-[1.2rem] border border-[#DDD4C8] bg-[#FBFAF7] px-3.5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8E5A45]">
                          <Image
                            src={resolveCharacterImage(
                              f.character ?? undefined,
                              f.reviewCount ?? 0,
                            )}
                            alt={f.nickname}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-text-main text-[13px] font-black">{f.nickname}</p>
                          <p className="text-text-main/45 text-[11px] font-medium">
                            {f.reviewCount ?? 0}종 시음
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (displayStatus === 'NONE') {
                            handleInviteFriend(f.userId, f.nickname);
                          }
                        }}
                        className={cn(
                          'rounded-full px-3.5 py-1.5 text-[10px] font-black transition-colors',
                          displayStatus === 'ACCEPTED'
                            ? 'bg-[#8B8B8B] text-white'
                            : displayStatus === 'PENDING'
                              ? 'text-text-main/55 bg-[#F3EFE8]'
                              : 'bg-[#F6EAEA] text-[#B17672]',
                        )}
                        disabled={displayStatus !== 'NONE' || inviteFriendMutation.isPending}
                      >
                        {displayStatus === 'ACCEPTED'
                          ? '친구'
                          : displayStatus === 'PENDING'
                            ? '요청 중'
                            : '친구 요청'}
                      </button>
                    </div>
                  );
                })
              ) : isSearching ? (
                <div className="text-text-main/50 py-8 text-center text-[13px] font-medium">
                  검색 중...
                </div>
              ) : friendSearchQuery.trim().length >= 2 ? (
                <div className="text-text-main/50 py-8 text-center text-[13px] font-medium">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="text-text-main/50 py-8 text-center text-[13px] font-medium">
                  닉네임을 2글자 이상 검색해 보세요.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
