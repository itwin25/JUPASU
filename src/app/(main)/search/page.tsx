'use client';

import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, Star } from 'lucide-react';
import Chip from '@/components/ui/chip/Chip';
import Image from 'next/image';
import { useModal } from '@/hooks/useModal';
import Button from '@/components/ui/button/Button';
import { cn } from '@/lib/utils';

const WINE_TYPES = ['RED', 'WHITE', 'ROSE', 'DESSERT', 'FORTIFIED'];
const COUNTRIES = ['프랑스', '이탈리아', '미국', '스페인', '칠레'];

const DUMMY_WINES = [
  { id: 1, name: 'Chateau Margaux', category: 'RED', subCategory: 'Bordeaux Red', match: 95, rating: 4.8, price: '120,000' },
  { id: 2, name: 'Cloudy Bay', category: 'WHITE', subCategory: 'Sauvignon Blanc', match: 95, rating: 4.5, price: '45,000' },
  { id: 3, name: 'Whispering Angel', category: 'ROSE', subCategory: 'Provence Rose', match: 88, rating: 4.3, price: '35,000' },
  { id: 4, name: 'Moet & Chandon', category: 'FORTIFIED', subCategory: 'Champagne', match: 92, rating: 4.7, price: '85,000' },
];

export default function SearchPage() {
  const [activeType, setActiveType] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState(4);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  // Filtering Logic
  const filteredWines = useMemo(() => {
    return DUMMY_WINES.filter((wine) => {
      // Search Query filter
      const matchesSearch = wine.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           wine.subCategory.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category Chip filter
      const matchesCategory = activeType === 'ALL' || wine.category === activeType;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeType]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-text-main italic tracking-tight uppercase">EXPLORE</h1>
          <p className="text-sm text-text-main/40 font-medium">새로운 와인을 발견해 보세요</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-main/30" size={20} />
            <input
              className="w-full bg-white border-2 border-primary-100 rounded-full py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-primary-500 transition-colors"
              placeholder="와인 이름, 종류, 키워드..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="w-10 h-10 bg-white border border-primary-100 rounded-full flex items-center justify-center text-text-main/40 shadow-sm"
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
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
              className="px-4 py-2 text-xs font-bold border-none"
            >
              {type}
            </Chip>
          ))}
        </div>
      </header>

      {/* Wine Grid */}
      <main className="flex-1 px-4 grid grid-cols-2 gap-3 overflow-y-auto no-scrollbar pt-1 items-start content-start">
        {filteredWines.length > 0 ? (
          filteredWines.map((wine) => (
            <div key={wine.id} className="bg-white rounded-[20px] border border-primary-100 shadow-sm flex flex-col overflow-hidden">
              <div className="w-full aspect-[4/5] bg-gray-100 relative">
                 <div className="absolute top-2 left-2 bg-[#B36262] text-white text-[10px] font-black px-2 py-1 rounded-full z-10">
                    {wine.match}% MATCH
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">🍷</div>
              </div>
              <div className="p-3 space-y-1.5">
                 <h3 className="font-black text-sm text-text-main leading-tight truncate">{wine.name}</h3>
                 <p className="text-[10px] text-text-main/40 font-bold">{wine.subCategory}</p>
                 <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-center gap-0.5 text-[#FF8A00] font-black text-xs">
                      <Star size={10} fill="#FF8A00" className="text-[#FF8A00]" /> {wine.rating}
                    </div>
                    <span className="text-xs font-black text-text-main leading-none mt-0.5">₩{wine.price}</span>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-20 text-center">
            <p className="text-text-main/40 font-bold">검색 결과가 없습니다.</p>
          </div>
        )}
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
                      <Chip 
                        key={type} 
                        active={selectedTypes.includes(type)}
                        variant={selectedTypes.includes(type) ? 'primary' : 'secondary'}
                        onClick={() => toggleType(type)}
                        className="px-5 text-xs font-bold border-none"
                      >
                        {type}
                      </Chip>
                    ))}
                 </div>
              </div>

              {/* Price Range - Interactive inputs */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Price Range</span>
                 <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-2 flex items-center justify-center focus-within:border-[#B36262] transition-colors">
                      <input 
                        type="number" 
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        placeholder="5"
                        className="w-full text-center font-black text-text-main outline-none placeholder:text-text-main/20"
                      />
                    </div>
                    <span className="text-text-main/30">~</span>
                    <div className="flex-1 bg-white border-2 border-primary-100 rounded-2xl p-2 flex items-center justify-center focus-within:border-[#B36262] transition-colors">
                      <input 
                        type="number" 
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        placeholder="15"
                        className="w-full text-center font-black text-text-main outline-none placeholder:text-text-main/20"
                      />
                    </div>
                    <span className="text-sm font-bold text-text-main/40">만원</span>
                 </div>
              </div>

              {/* Average Rating - Interactive selection */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Average Rating</span>
                 <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                       {[1, 2, 3, 4, 5].map((s) => (
                         <button key={s} onClick={() => setSelectedRating(s)}>
                           <Star 
                             size={28} 
                             fill={s <= selectedRating ? "#B36262" : "none"} 
                             className={cn(
                               "transition-all",
                               s <= selectedRating ? "text-[#B36262]" : "text-primary-100"
                             )} 
                           />
                         </button>
                       ))}
                    </div>
                    <span className="text-lg font-black text-[#B36262] mt-1">{selectedRating}+</span>
                 </div>
              </div>

              {/* Countries */}
              <div className="space-y-3">
                 <span className="text-sm font-black text-text-main">Countries</span>
                 <div className="flex flex-wrap gap-2">
                    {COUNTRIES.map((country) => (
                      <Chip 
                        key={country} 
                        active={selectedCountries.includes(country)}
                        variant={selectedCountries.includes(country) ? 'primary' : 'secondary'}
                        onClick={() => toggleCountry(country)}
                        className="px-5 text-xs font-bold border-none"
                      >
                        {country}
                      </Chip>
                    ))}
                 </div>
              </div>

              {/* Reset & Apply Buttons */}
              <div className="pt-6 flex gap-3 border-t border-primary-100">
                 <button 
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedCountries([]);
                    setSelectedRating(0);
                    setPriceRange({ min: '', max: '' });
                  }}
                  className="flex-1 bg-white border border-primary-100 py-4 rounded-2xl text-sm font-black text-text-main/40 active:scale-95 transition-transform"
                 >
                    초기화
                 </button>
                 <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-[2] bg-[#B36262] text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-[#B36262]/20 active:scale-95 transition-transform"
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
