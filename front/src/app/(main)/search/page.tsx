'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import Chip from '@/components/ui/chip/Chip';
import Link from 'next/link';
import { ROUTE_PATH } from '@/constants/route-path';
import { cn } from '@/lib/utils';
import { api } from '@/lib/axios';

const WINE_TYPES = ['RED', 'WHITE', 'ROSE', 'DESSERT', 'FORTIFIED'];
const COUNTRIES = ['프랑스', '이탈리아', '미국', '스페인', '칠레'];

// ⭐️ 프론트엔드의 public 폴더에 있는 기본 이미지 경로
const DEFAULT_WINE_IMAGE_URL = '/default_wine.png';

interface WineSearchResponse {
  id: number;
  nameKr: string;
  nameEn: string;
  type: string;
  country: string;
  averageRating: number;
  price: number;
  imageUrl: string;
}

export default function SearchPage() {
  const [activeType, setActiveType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [wines, setWines] = useState<WineSearchResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ⭐️ [복구완료] 페이징을 위한 상태 관리
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filter States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // ⭐️ [복구완료] currentPage와 append(이어붙이기) 여부를 받도록 수정된 API 호출 함수
  const fetchWines = async (currentPage = 0, append = false) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: 10, // 한 번에 10개씩 불러오기
      };

      if (searchQuery) params.keyword = searchQuery;

      if (activeType !== 'ALL') {
        params.type = activeType;
      } else if (selectedTypes.length > 0) {
        params.type = selectedTypes[0];
      }

      if (priceRange.min) params.minPrice = Number(priceRange.min) * 10000;
      if (priceRange.max) params.maxPrice = Number(priceRange.max) * 10000;
      if (selectedRating > 0) params.minRate = selectedRating;
      if (selectedCountries.length > 0) params.country = selectedCountries[0];

      // API 요청 주소 (/wines)
      const response = await api.get('/wines', { params });

      const responseData = response.data?.data;
      const content = responseData?.content || [];
      const isLast = responseData?.last ?? true;

      if (append) {
        // 더 보기 버튼을 눌렀을 때는 기존 배열에 새 데이터를 이어붙임
        setWines((prev) => [...prev, ...content]);
      } else {
        // 검색이나 필터가 바뀌었을 때는 배열을 아예 새로고침
        setWines(content);
      }

      setHasMore(!isLast); // 마지막 페이지가 아니면 더 보기 버튼 활성화
      setPage(currentPage + 1); // 다음 페이지 번호 저장
    } catch (error) {
      console.error('와인 데이터를 불러오는데 실패했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 상단 탭이 변경될 때는 무조건 0페이지부터 다시 검색 (append: false)
  useEffect(() => {
    fetchWines(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType]);

  // 엔터 키를 눌렀을 때도 0페이지부터 다시 검색
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchWines(0, false);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country],
    );
  };

  return (
    <div className="bg-background flex min-h-screen flex-col pb-24">
      {/* Header */}
      <header className="space-y-4 px-6 pt-10 pb-4">
        <div>
          <h1 className="text-text-main text-2xl font-black tracking-tight uppercase italic">
            EXPLORE
          </h1>
          <p className="text-text-main/40 text-sm font-medium">새로운 와인을 발견해 보세요</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="text-text-main/30 absolute top-1/2 left-4 -translate-y-1/2"
              size={20}
            />
            <input
              className="border-primary-100 focus:border-primary-500 w-full rounded-full border-2 bg-white py-3 pr-4 pl-12 text-sm font-bold transition-colors focus:outline-none"
              placeholder="와인 이름, 종류, 키워드... (입력 후 Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="border-primary-100 text-text-main/40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition-transform active:scale-95"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Category Chips */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto py-1">
          <style jsx>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          {['ALL', ...WINE_TYPES].map((type) => (
            <Chip
              key={type}
              active={activeType === type}
              variant={activeType === type ? 'primary' : 'secondary'}
              onClick={() => setActiveType(type)}
              className="cursor-pointer border-none px-4 py-2 text-xs font-bold"
            >
              {type}
            </Chip>
          ))}
        </div>
      </header>

      {/* Wine Grid */}
      <main className="no-scrollbar flex-1 overflow-y-auto px-4 pt-1">
        <div className="grid grid-cols-2 content-start items-start gap-3">
          {wines.length > 0 ? (
            wines.map((wine) => (
              <Link
                key={wine.id}
                href={ROUTE_PATH.WINE_DETAIL(wine.id)}
                prefetch={false}
                className="border-primary-100 flex flex-col overflow-hidden rounded-[20px] border bg-white shadow-sm transition-transform active:scale-[0.98]"
              >
                {/* ⭐️ DB값이 /images/default_wine.png 일 경우 public 이미지로 교체, 여백/비율 완벽 유지 */}
                <div className="relative flex aspect-[1/1] w-full items-center justify-center overflow-hidden bg-white">
                  <img
                    src={
                      wine.imageUrl === '/images/default_wine.png'
                        ? DEFAULT_WINE_IMAGE_URL
                        : wine.imageUrl || DEFAULT_WINE_IMAGE_URL
                    }
                    alt={wine.nameKr || wine.nameEn}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_WINE_IMAGE_URL;
                      e.currentTarget.onerror = null; // 무한 루프 방지
                    }}
                  />
                </div>
                <div className="space-y-1.5 p-3">
                  <h3 className="text-text-main truncate text-sm leading-tight font-black">
                    {wine.nameKr || wine.nameEn}
                  </h3>
                  <p className="text-text-main/40 truncate text-[10px] font-bold">
                    {wine.country || '원산지 미상'} • {wine.type}
                  </p>
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-0.5 text-xs font-black text-[#FF8A00]">
                      <Star size={10} fill="#FF8A00" className="text-[#FF8A00]" />{' '}
                      {wine.averageRating?.toFixed(1) || '0.0'}
                    </div>
                    <span className="text-text-main mt-0.5 text-xs leading-none font-black">
                      ₩{wine.price ? wine.price.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : !isLoading ? (
            <div className="col-span-2 py-20 text-center">
              <p className="text-text-main/40 font-bold">검색 결과가 없습니다.</p>
            </div>
          ) : null}
        </div>

        {/* ⭐️ [복구완료] 더 보기(Load More) 버튼 */}
        {hasMore && wines.length > 0 && (
          <div className="flex justify-center py-8">
            <button
              onClick={() => fetchWines(page, true)}
              disabled={isLoading}
              className="border-primary-100 text-text-main cursor-pointer rounded-full border-2 bg-white px-8 py-3 text-sm font-black shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}

        {/* 초기 로딩 시 메시지 */}
        {isLoading && wines.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-text-main/40 animate-pulse font-bold">
              와인 데이터를 불러오는 중입니다...
            </p>
          </div>
        )}
      </main>

      {/* Filter Bottom Sheet Overlay */}
      {isFilterOpen && (
        <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 duration-300">
          <div className="absolute inset-0" onClick={() => setIsFilterOpen(false)} />
          <div className="animate-in slide-in-from-bottom-full relative space-y-8 rounded-t-[40px] bg-white p-8 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-text-main text-xl font-black">필터</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-text-main/30 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Wine Types */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="text-text-main text-sm font-black">Wine types</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WINE_TYPES.map((type) => (
                  <Chip
                    key={type}
                    active={selectedTypes.includes(type)}
                    variant={selectedTypes.includes(type) ? 'primary' : 'secondary'}
                    onClick={() => toggleType(type)}
                    className="cursor-pointer border-none px-5 text-xs font-bold"
                  >
                    {type}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <span className="text-text-main text-sm font-black">Price Range</span>
              <div className="flex items-center gap-3">
                <div className="border-primary-100 flex flex-1 items-center justify-center rounded-2xl border-2 bg-white p-2 transition-colors focus-within:border-[#B36262]">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="5"
                    className="text-text-main placeholder:text-text-main/20 w-full text-center font-black outline-none"
                  />
                </div>
                <span className="text-text-main/30">~</span>
                <div className="border-primary-100 flex flex-1 items-center justify-center rounded-2xl border-2 bg-white p-2 transition-colors focus-within:border-[#B36262]">
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="15"
                    className="text-text-main placeholder:text-text-main/20 w-full text-center font-black outline-none"
                  />
                </div>
                <span className="text-text-main/40 text-sm font-bold">만원</span>
              </div>
            </div>

            {/* Average Rating */}
            <div className="space-y-3">
              <span className="text-text-main text-sm font-black">Average Rating</span>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setSelectedRating(s)} className="cursor-pointer">
                      <Star
                        size={28}
                        fill={s <= selectedRating ? '#B36262' : 'none'}
                        className={cn(
                          'transition-all',
                          s <= selectedRating ? 'text-[#B36262]' : 'text-primary-100',
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="mt-1 text-lg font-black text-[#B36262]">{selectedRating}+</span>
              </div>
            </div>

            {/* Countries */}
            <div className="space-y-3">
              <span className="text-text-main text-sm font-black">Countries</span>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((country) => (
                  <Chip
                    key={country}
                    active={selectedCountries.includes(country)}
                    variant={selectedCountries.includes(country) ? 'primary' : 'secondary'}
                    onClick={() => toggleCountry(country)}
                    className="cursor-pointer border-none px-5 text-xs font-bold"
                  >
                    {country}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Reset & Apply Buttons */}
            <div className="border-primary-100 flex gap-3 border-t pt-6">
              <button
                onClick={() => {
                  setSelectedTypes([]);
                  setSelectedCountries([]);
                  setSelectedRating(0);
                  setPriceRange({ min: '', max: '' });
                }}
                className="border-primary-100 text-text-main/40 flex-1 cursor-pointer rounded-2xl border bg-white py-4 text-sm font-black transition-transform active:scale-95"
              >
                초기화
              </button>
              <button
                onClick={() => {
                  setIsFilterOpen(false);
                  fetchWines(0, false); // ⭐️ 필터 적용 시 0페이지부터 다시 검색!
                }}
                className="flex-[2] cursor-pointer rounded-2xl bg-[#B36262] py-4 text-sm font-black text-white shadow-lg shadow-[#B36262]/20 transition-transform active:scale-95"
              >
                필터 적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
