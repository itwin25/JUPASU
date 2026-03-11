'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Chip from '@/components/ui/chip/Chip';

// 가로 슬라이드 갤러리 와인 데이터
const GALLERY_WINES = [
  { id: 1, name: 'CHATEAU MARGAUX', category: 'HEAVY & DRY', match: 95, desc: '스테이크와 찰떡궁합!', body: 5, sweet: 2, acid: 3 },
  { id: 2, name: 'CLOUD BAY', category: 'FRESH & CRISP SAU', match: 95, desc: '해산물 요리에 딱', body: 3, sweet: 3, acid: 4 },
  { id: 3, name: 'OPUS ONE 2019', category: 'RICH & BOLD RED', match: 92, desc: '특별한 날을 위해', body: 5, sweet: 1, acid: 4 },
];

// 상황별 추천 와인 데이터 세트
const RECOMMENDATIONS_BY_SITUATION: Record<string, any[]> = {
  '혼술': [
    { id: 4, name: '19 Crimes Red', desc: '하루의 피로를 녹여줄 한 잔', price: '25,000' },
    { id: 5, name: 'Goreb Chandon', desc: '가볍게 즐기는 혼술 와인', price: '52,000' },
  ],
  '기념일': [
    { id: 1, name: 'Dom Perignon', desc: '특별한 순간을 위한 샴페인', price: '320,000' },
    { id: 6, name: 'Krug Grande Cuvee', desc: '완벽한 축배를 위해', price: '450,000' },
  ],
  '피자': [
    { id: 7, name: 'Chianti Classico', desc: '피자와 환상의 궁합인 레드', price: '38,000' },
    { id: 8, name: 'Primitivo', desc: '진한 소스와 잘 어울려요', price: '29,000' },
  ],
  '파티': [
    { id: 9, name: 'Moet & Chandon', desc: '모두가 좋아하는 파티 와인', price: '75,000' },
    { id: 10, name: 'Veuve Clicquot', desc: '활기찬 분위기에 딱!', price: '89,000' },
  ],
};

const SITUATIONS = ['혼술', '기념일', '피자', '파티'];

export default function HomePage() {
  const [activeSituation, setActiveSituation] = useState('혼술');

  return (
    <div className="flex flex-col bg-background pb-24 min-h-screen">
      {/* 1. Header */}
      <div className="flex justify-center py-2 bg-background sticky top-0 z-10">
        <div className="relative h-15 w-15">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
      </div>

      {/* 2. Vibe Gallery Section */}
      <section className="px-6 pt-2 pb-4">
        <h2 className="text-xl font-black text-text-main mb-4 tracking-tight italic uppercase">VIBE GALLERY</h2>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
          {GALLERY_WINES.map((wine) => (
            <Link key={wine.id} href={`/wines/${wine.id}`}>
              <div className="min-w-[230px] bg-white rounded-[20px] overflow-hidden shadow-sm border border-primary-100 relative transition-all active:scale-95 hover:shadow-md">
                <div className="absolute top-2 left-2 z-10 bg-[#B36262] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg">
                  {wine.match}% MATCH
                </div>
                
                <div className="w-full aspect-square bg-gray-50 relative flex items-center justify-center overflow-hidden">
                  <span className="text-6xl z-10">🍷</span>
                </div>

                <div className="p-5 space-y-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-[#B36262] uppercase tracking-widest">{wine.category}</p>
                    <h3 className="text-lg font-black text-text-main leading-none truncate">{wine.name}</h3>
                    <p className="text-xs font-bold text-[#FF8A00] truncate">{wine.desc}</p>
                  </div>

                  <div className="space-y-1 pt-1">
                    {['BODY', 'SWEET', 'ACID'].map((label) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[12px] font-black text-text-main/40 tracking-tighter">{label}</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((d) => (
                            <div 
                              key={d} 
                              className={`w-2 h-2 rotate-45 transition-colors ${
                                d <= (wine as any)[label.toLowerCase()] ? 'bg-[#B36262]' : 'bg-primary-100'
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Editor's Pick Section */}
      <section className="px-6 py-4">
        <h2 className="text-xl font-black text-text-main mb-4 tracking-tight italic uppercase">형선’s pick!</h2>
        
        {/* 상황 버튼 필터 */}
        <div className="flex gap-2 overflow-x-auto mb-6 no-scrollbar">
          {SITUATIONS.map((cat) => (
            <Chip 
              key={cat} 
              active={activeSituation === cat} 
              variant={activeSituation === cat ? 'primary' : 'secondary'} 
              className="px-6 py-2 text-xs font-black transition-all"
              onClick={() => setActiveSituation(cat)}
            >
              {cat}
            </Chip>
          ))}
        </div>

        {/* 상황에 따른 와인 리스트 추천 */}
        <div className="space-y-6 animate-in fade-in duration-500">

          {RECOMMENDATIONS_BY_SITUATION[activeSituation].map((wine) => (
            <Link key={wine.id} href={`/wines/${wine.id}`}>
              <div className="flex items-center gap-4 bg-white p-2.5 rounded-[20px] border border-primary-100 shadow-sm transition-all active:scale-95 active:bg-gray-50 hover:border-primary-200">
                <div className="w-18 h-18 bg-[#FFE5E5] rounded-[20px] flex items-center justify-center shrink-0">
                  <span className="text-2xl">🍷</span>
                </div>
                <div className="flex-1 space-y-0.5">
                  <h4 className="font-bold text-base text-text-main leading-tight">{wine.name}</h4>
                  <p className="text-[11px] text-text-main/40 font-bold">{wine.desc}</p>
                  <p className="text-base font-black text-[#B36262] mt-1">₩{wine.price}</p>
                </div>
                <ChevronRightIcon className="text-primary-100" size={20} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Global CSS for hiding scrollbars */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function ChevronRightIcon({ className, size }: { className?: string, size?: number }) {
  return (
    <svg className={className} width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
