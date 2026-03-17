'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserMyPage } from '@/features/user/hooks/useUserMyPage';
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
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

type ReviewItem = {
  id: number;
  author: string;
  wineName: string;
  subtitle: string;
  rating: number;
  content: string;
  date: string;
  avatar: string;
};

type WishlistItem = {
  id: number;
  name: string;
  subtitle: string;
  rating: number;
  price: string;
  countryFlag: string;
  match: string;
};

type FriendItem = {
  id: number;
  name: string;
  winesTasted: number;
  avatar: string;
};

type SearchFriendItem = FriendItem & {
  status: 'friend' | 'pending';
};

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 1,
    author: '와인초보',
    wineName: 'Cloudy Bay',
    subtitle: 'Sauvignon Blanc',
    rating: 4,
    content: '여름에 시원하게 마시면 최고! 상큼하고 깔끔해요.',
    date: '2026.01.05',
    avatar: '/dog1.svg',
  },
  {
    id: 2,
    author: '와인러버민지',
    wineName: 'Chateau Margaux 2018',
    subtitle: 'Bordeaux Red',
    rating: 5,
    content: '특별한 날에 열면 분위기가 확 살아나는 레드였어요.',
    date: '2025.12.28',
    avatar: '/dog2.svg',
  },
];

const WISHLIST_ITEMS: WishlistItem[] = [
  {
    id: 1,
    name: 'Chateau Margaux 2018',
    subtitle: 'Bordeaux Red',
    rating: 4.8,
    price: '₩120,000',
    countryFlag: '🇫🇷',
    match: '95%',
  },
  {
    id: 2,
    name: 'Cloudy Bay',
    subtitle: 'Sauvignon Blanc',
    rating: 4.7,
    price: '₩58,000',
    countryFlag: '🇳🇿',
    match: '92%',
  },
];

const FRIENDS: FriendItem[] = [
  { id: 1, name: 'zzz', winesTasted: 28, avatar: '/dog1.svg' },
  { id: 2, name: '보르도매니아', winesTasted: 65, avatar: '/dog2.svg' },
  { id: 3, name: '로제', winesTasted: 7, avatar: '/cat1.svg' },
];

const FRIEND_REQUESTS: FriendItem[] = [
  { id: 11, name: '와인러버민지', winesTasted: 28, avatar: '/dog1.svg' },
  { id: 12, name: '와인러버도희', winesTasted: 28, avatar: '/dog2.svg' },
];

const SEARCH_RESULTS: SearchFriendItem[] = [
  { id: 21, name: '와인러버민지', winesTasted: 28, avatar: '/dog1.svg', status: 'friend' },
  { id: 22, name: '보르도매니아', winesTasted: 28, avatar: '/dog2.svg', status: 'pending' },
  { id: 23, name: '민지야술그만마셔라', winesTasted: 28, avatar: '/dog3.svg', status: 'pending' },
];

const PAGINATION = [1, 2, 3, 4, 5];

const modalClassName =
  'w-[calc(100vw-1rem)] max-w-[20.5rem] rounded-[1.7rem] bg-[#F7F5F1] px-3.5 py-4 sm:max-w-[21.5rem] sm:px-4';

function Pagination() {
  return (
    <div className="text-text-main/45 flex items-center justify-center gap-3 pt-5 text-xs">
      <button className="text-text-main/20">
        <ChevronLeft size={20} />
      </button>
      {PAGINATION.map((page) => (
        <button
          key={page}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
            page === 1 ? 'bg-[#B17672] text-white' : 'text-text-main/45',
          )}
        >
          {page}
        </button>
      ))}
      <button className="text-text-main">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function MyPage() {
  const { data: profile, isLoading } = useUserMyPage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBestOpen, setIsBestOpen] = useState(true);
  const [isWorstOpen, setIsWorstOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<'wishlist' | 'reviews' | 'friends' | null>(null);
  const [friendTab, setFriendTab] = useState<'list' | 'search' | 'requests'>('list');
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [activeReviewMenuId, setActiveReviewMenuId] = useState<number | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedRating, setEditedRating] = useState(0);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const router = useRouter();
  const logout = useAuthStore((state) => state.clearAuth);
  const editingReview = reviews.find((review) => review.id === editingReviewId) ?? null;

  const filteredFriendResults = useMemo(() => {
    if (!friendSearchQuery.trim()) return SEARCH_RESULTS;
    const query = friendSearchQuery.toLowerCase();
    return SEARCH_RESULTS.filter((friend) => friend.name.toLowerCase().includes(query));
  }, [friendSearchQuery]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const openReviewEditModal = (review: ReviewItem) => {
    setActiveReviewMenuId(null);
    setEditingReviewId(review.id);
    setEditedContent(review.content);
    setEditedRating(review.rating);
  };

  const closeReviewEditModal = () => {
    setEditingReviewId(null);
    setEditedContent('');
    setEditedRating(0);
  };

  const saveReview = () => {
    if (!editingReview) return;

    setReviews((prev) =>
      prev.map((review) =>
        review.id === editingReview.id
          ? { ...review, content: editedContent.trim(), rating: editedRating }
          : review,
      ),
    );
    closeReviewEditModal();
  };

  const deleteReview = () => {
    if (deletingReviewId === null) return;
    setReviews((prev) => prev.filter((review) => review.id !== deletingReviewId));
    setDeletingReviewId(null);
  };

  return (
    <div className="bg-background min-h-screen pb-24">
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
                <span className="text-text-main text-[13px] font-bold">취향 분석 보기</span>
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
                src={profile?.character ? `/${profile.character}.svg` : '/dog1.svg'}
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
            <div className="h-3 rounded-full bg-white">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#D65F69] to-[#B36262] transition-all duration-500"
                style={{ width: `${Math.min(((profile?.reviewCount || 0) / 10) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="divide-primary-100 mt-4 grid grid-cols-3 divide-x">
            <button onClick={() => setActiveModal('wishlist')} className="py-2 text-center">
              <p className="text-lg font-black text-[#B36262]">{profile?.wishlistCount ?? 0}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">위시리스트</p>
            </button>
            <button onClick={() => setActiveModal('reviews')} className="py-2 text-center">
              <p className="text-lg font-black text-[#B36262]">{profile?.reviewCount ?? 0}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">리뷰</p>
            </button>
            <button
              onClick={() => {
                setFriendTab('list');
                setActiveModal('friends');
              }}
              className="py-2 text-center"
            >
              <p className="text-lg font-black text-[#B36262]">{profile?.friendCount ?? 0}</p>
              <p className="text-text-main/45 mt-1 text-[11px] font-bold">친구</p>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-text-main px-4 text-[1.2rem] font-black">AI 나의 취향 리포트</h3>

          <div className="border-primary-100 mt-3 rounded-[1.5rem] border bg-white p-4 shadow-sm">
            <div className="bg-white px-1 py-1">
              <p className="text-text-main text-center text-[11px] leading-relaxed font-black">
                와인초보님은 &apos;상큼하고 가벼운&apos; 화이트 와인 취향이에요!
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
                    points="120,73 171,98 157,157 86,163 61,97"
                    fill="rgba(196, 91, 91, 0.16)"
                    stroke="#C75B5B"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                </svg>

                <span className="text-text-main/55 absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-medium">
                  탄닌
                </span>
                <span className="text-text-main/55 absolute top-[72px] right-[2px] text-[10px] font-medium">
                  산미
                </span>
                <span className="text-text-main/55 absolute right-[34px] bottom-[28px] text-[10px] font-medium">
                  바디
                </span>
                <span className="text-text-main/55 absolute bottom-[28px] left-[34px] text-[10px] font-medium">
                  당도
                </span>
                <span className="text-text-main/55 absolute top-[72px] left-[0px] text-[10px] font-medium">
                  도수
                </span>
                <button className="absolute right-[2px] bottom-[26px] flex h-4 w-4 items-center justify-center rounded-full bg-[#A76B6B] text-[10px] font-bold text-white">
                  ?
                </button>
              </div>

              <div className="mt-1 flex justify-center">
                <span className="rounded-full bg-[#F6EAE6] px-4 py-1.5 text-[10px] font-black text-[#C98674]">
                  과일향 러버 타입
                </span>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6EAE6] text-[16px]">
                  🧑🏻
                </div>
                <p className="text-text-main/80 text-[12px] leading-5 font-medium">
                  과일향이 풍부하고 당도가 적절한 와인을 산미가 살아있는 와인에 높은 점수를
                  주셨어요. 탄닌이 강하지 않은 미디엄 바디 스타일을 선호하는 편이에요.
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
                      피노 누아, 리슬링, 소비뇽 블랑 계열을 더 탐색해 보세요!
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
                      피노 누아, 리슬링, 소비뇽 블랑 계열을 더 탐색해 보세요!
                    </p>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Modal
        isOpen={activeModal === 'wishlist'}
        onClose={() => setActiveModal(null)}
        title="위시리스트"
        hideDefaultFooter
        className={modalClassName}
      >
        <div className="bg-primary-100/80 mb-4 h-px" />
        <div className="space-y-3">
          {WISHLIST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.25rem] border border-[#B97B79] bg-[#FBFAF7] p-2.5 shadow-sm"
            >
              <div className="flex gap-2.5">
                <div className="h-16 w-12 shrink-0 rounded-[0.8rem] bg-[#E6E3DE]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-text-main truncate text-sm font-black">{item.name}</h4>
                      <p className="text-text-main/45 mt-0.5 text-[11px] font-medium">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="text-xs">{item.countryFlag}</span>
                      <span className="text-[10px] font-black text-[#C87E7A]">{item.match}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black text-[#D89A4F]">★ {item.rating}</span>
                      <span className="text-xs font-black text-[#CC5C57]">{item.price}</span>
                    </div>
                    <button className="text-[#CC5C57]">
                      <Heart size={16} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination />
      </Modal>

      <Modal
        isOpen={activeModal === 'reviews'}
        onClose={() => {
          setActiveModal(null);
          setActiveReviewMenuId(null);
        }}
        title="내가 작성한 리뷰"
        hideDefaultFooter
        className={modalClassName}
      >
        <div className="bg-primary-100/80 mb-4 h-px" />
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[1.25rem] border border-[#B97B79] bg-[#FBFAF7] p-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#7D4E3A]">
                    <Image src={review.avatar} alt={review.author} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-text-main text-[13px] font-black">{review.author}</h4>
                    <div className="mt-0.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          fill={star <= review.rating ? '#D89A4F' : '#E0DDD7'}
                          className={star <= review.rating ? 'text-[#D89A4F]' : 'text-[#E0DDD7]'}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() =>
                      setActiveReviewMenuId((prev) => (prev === review.id ? null : review.id))
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

              <p className="text-text-main mt-2.5 text-[13px] leading-relaxed font-medium">
                {review.content}
              </p>
              <div className="mt-1.5 flex justify-end">
                <span className="text-[11px] font-medium text-[#B97B79]">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
        <Pagination />
      </Modal>

      <Modal
        isOpen={editingReview !== null}
        onClose={closeReviewEditModal}
        title="리뷰 수정"
        hideDefaultFooter
        className="w-[calc(100vw-0.75rem)] max-w-[20.5rem] rounded-[1.7rem] bg-[#F7F5F1] px-3.5 py-4"
      >
        {editingReview ? (
          <div className="space-y-4">
            <div className="border-primary-100 rounded-[1.2rem] border bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="h-14 w-10 shrink-0 rounded-[0.75rem] bg-[#DDD2C1]" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-text-main truncate text-sm font-black">
                    {editingReview.wineName}
                  </h4>
                  <p className="text-text-main/35 mt-0.5 text-xs font-medium">
                    {editingReview.subtitle}
                  </p>
                </div>
                <span className="text-text-main/35 rounded-full bg-[#F3EFE8] px-2 py-1 text-[10px] font-black">
                  수정 중
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-text-main text-[15px] font-black">별점</h5>
              <div className="mt-2.5 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditedRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      size={30}
                      fill={star <= editedRating ? '#D89A4F' : '#E9E2D8'}
                      className={star <= editedRating ? 'text-[#D89A4F]' : 'text-[#E9E2D8]'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-text-main text-[15px] font-black">리뷰 내용</h5>
              <div className="relative mt-2.5">
                <textarea
                  value={editedContent}
                  onChange={(event) => setEditedContent(event.target.value.slice(0, 500))}
                  className="border-primary-100 text-text-main focus:border-primary-500 h-28 w-full resize-none rounded-[1.2rem] border bg-white p-3.5 text-[13px] leading-relaxed font-medium transition-colors outline-none"
                  placeholder="리뷰 내용을 입력해 주세요."
                />
                <span className="text-text-main/30 absolute right-4 bottom-4 text-[10px] font-bold">
                  {editedContent.length}/500
                </span>
              </div>
            </div>

            <Button
              size="full"
              onClick={saveReview}
              disabled={editedContent.trim().length < 5 || editedRating === 0}
              className="h-11 rounded-[1rem] bg-[#B37474] text-sm font-black hover:bg-[#9E6666]"
            >
              리뷰 수정하기
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={deletingReviewId !== null}
        onClose={() => setDeletingReviewId(null)}
        title="리뷰 삭제"
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
                친구 요청 ({FRIEND_REQUESTS.length})
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
              <p className="text-text-main/45 mb-3 text-sm font-medium">친구 {FRIENDS.length}명</p>
              <div className="max-h-[18rem] space-y-2.5 overflow-y-auto pr-1">
                {FRIENDS.map((friend) => (
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
                          {friend.winesTasted}종 시음
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <button className="rounded-full bg-[#F6EAEA] px-3 py-1 text-[10px] font-black text-[#B17672]">
                        프로필
                      </button>
                      <button className="text-text-main/55 rounded-full bg-[#E8E5E0] px-3 py-1 text-[10px] font-black">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {friendTab === 'requests' && (
          <div className="space-y-2.5">
            {FRIEND_REQUESTS.map((friend) => (
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
                  <button className="rounded-full bg-[#F6EAEA] px-3 py-1 text-[10px] font-black text-[#B17672]">
                    수락
                  </button>
                  <button className="text-text-main/55 rounded-full bg-[#E8E5E0] px-3 py-1 text-[10px] font-black">
                    거절
                  </button>
                </div>
              </div>
            ))}
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

            <div className="space-y-2.5">
              {filteredFriendResults.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between rounded-[1.2rem] border border-[#DDD4C8] bg-[#FBFAF7] px-3.5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#8E5A45]">
                      <Image src={friend.avatar} alt={friend.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-text-main text-[13px] font-black">{friend.name}</p>
                      <p className="text-text-main/45 text-[11px] font-medium">
                        {friend.winesTasted}종 시음
                      </p>
                    </div>
                  </div>
                  <button
                    className={cn(
                      'rounded-full px-3.5 py-1 text-[10px] font-black',
                      friend.status === 'friend'
                        ? 'bg-[#8B8B8B] text-white'
                        : 'bg-[#F6EAEA] text-[#B17672]',
                    )}
                  >
                    {friend.status === 'friend' ? '친구' : '친구 요청'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
