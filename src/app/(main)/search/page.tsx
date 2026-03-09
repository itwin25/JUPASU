'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Chip from '@/components/ui/chip/Chip';
import Image from 'next/image';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/ui/button/Button';

const WINE_TYPES = ['RED', 'WHITE', 'ROSE', 'DESSERT', 'FORTIFIED'];
const COUNTRIES = ['프랑스', '이탈리아', '미국', '스페인', '칠레'];

const DUMMY_WINES = [
  { id: 1, name: 'Chateau Margaux', category: 'Bordeaux Red', match: 95, rating: 4.8, price: '120,000' },
  { id: 2, name: 'Cloudy Bay', category: 'Sauvignon Blanc', match: 95, rating: 4.5, price: '45,000' },
  { id: 3, name: 'Chateau Margaux', category: 'Bordeaux Red', match: 95, rating: 4.8, price: '120,000' },
  { id: 4, name: 'Cloudy Bay', category: 'Sauvignon Blanc', match: 95, rating: 4.5, price: '45,000' },
];

export default function SearchPage() {
  const [activeType, setActiveType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-text-main italic tracking-tight">EXPORE</h1>
          <p className="text-sm text-text-main/40 font-medium">새로운 와인을 발견해 보세요</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/30" size={20} />
            <input
              className="w-full bg-white border-2 border-primary-100 rounded-full py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="와인 이름, 종류, 키워드..."
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="w-12 h-12 bg-white border border-primary-100 rounded-full flex items-center justify-center text-text-main/40 shadow-sm"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {['ALL', ...WINE_TYPES].map((type) => (
            <Chip 
              key={type} 
              active={activeType === type}
              variant={activeType === type ? 'primary' : 'secondary'}
              onClick={() => setActiveType(type)}
              className="px-6"
            >
              {type}
            </Chip>
          ))}
        </div>
      </header>

      {/* Wine Grid */}
      <main className="flex-1 px-6 grid grid-cols-2 gap-4 overflow-y-auto no-scrollbar pt-2">
        {DUMMY_WINES.map((wine) => (
          <div key={wine.id} className="bg-white rounded-[40px] p-5 border border-primary-100 shadow-sm flex flex-col space-y-4">
            <div className="w-full aspect-[4/5] bg-gray-100 rounded-[32px] relative">
               <div className="absolute top-3 left-3 bg-[#B36262] text-white text-[8px] font-black px-2 py-1 rounded-full">
                  {wine.match}% MATCH
               </div>
            </div>
            <div className="space-y-1">
               <h3 className="font-black text-sm text-text-main leading-tight truncate">{wine.name}</h3>
               <p className="text-[10px] text-text-main/40 font-bold">{wine.category}</p>
               <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-0.5 text-[#FF8A00] font-black text-xs">
                    <span className="text-[10px]">★</span> {wine.rating}
                  </div>
                  <span className="text-xs font-black text-text-main leading-none mt-0.5">₩{wine.price}</span>
               </div>
            </div>
          </div>
        ))}
      </main>

      {/* Filter Bottom Sheet Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex flex-col justify-end animate-in fade-in duration-300">
           <div 
             className="absolute inset-0" 
             onClick={() => setIsFilterOpen(false)} 
           />
           <div className="relative bg-white rounded-t-[40px] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-300">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-black text-text-main">필터</h2>
                 <button onClick={() => setIsFilterOpen(false)} className="text-text-main/30">
                   <X size={24} />
                 </button>
              </div>

              {/* Wine Types */}
              <div className="space-y-3">
                 <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-text-main">Wine types</span>
                    <div className="w-4 h-4 rounded-full bg-text-main/20 flex items-center justify-center text-[10px] text-white font-bold">?</div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {WINE_TYPES.map((type) => (
                      <Chip key={type} variant="secondary" className="px-5 text-xs font-bold bg-primary-100/30 text-text-main/40 border-none">
                        {type}
                      </Chip>
                    ))}
                 </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Price Range</span>
                 <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-4 text-center font-bold">5</div>
                    <span className="text-text-main/30">~</span>
                    <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-4 text-center font-bold">15</div>
                    <span className="text-sm font-bold text-text-main/40">만원</span>
                 </div>
              </div>

              {/* Average Rating */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Average Rating</span>
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                       {[1, 2, 3, 4].map((s) => <span key={s} className="text-[#B36262] text-2xl">★</span>)}
                       <span className="text-primary-100 text-2xl">★</span>
                    </div>
                    <span className="text-sm font-bold text-text-main/40 mt-1">4+</span>
                 </div>
              </div>

              {/* Countries */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Countries</span>
                 <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((country) => (
                      <Chip key={country} variant="secondary" className="px-5 text-xs font-bold bg-primary-100/30 text-text-main/40 border-none">
                        {country}
                      </Chip>
                    ))}
                 </div>
              </div>

              <div className="pt-4">
                 <button className="w-full text-text-main/40 text-sm font-bold py-2">더보기</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
