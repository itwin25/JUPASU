'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button/Button';

export default function WineDetailPage({ params }: { params: { wineId: string } }) {
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-6 bg-transparent">
        <Link href="/search" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 text-text-main">
          <Heart size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
        {/* Wine Hero Area */}
        <div className="px-6 pt-24 pb-10">
          <div className="w-full aspect-square bg-[#EBE6DF] rounded-[60px] relative flex items-center justify-center overflow-hidden mb-8">
            <div className="relative w-40 h-64">
               {/* Wine Bottle Image Placeholder */}
               <div className="absolute inset-0 bg-[#B36262]/20 rounded-full blur-3xl scale-75" />
               <span className="absolute inset-0 flex items-center justify-center text-8xl">🍷</span>
            </div>
            <div className="absolute bottom-8 left-8 bg-[#B36262] text-white text-xs font-black px-5 py-2 rounded-full shadow-lg">
              95% MATCH
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-xs font-black text-[#B36262] uppercase tracking-widest">BORDEAUX RED</p>
                 <h1 className="text-3xl font-black text-text-main leading-tight">Chateau Margaux</h1>
               </div>
               <div className="text-2xl">🇫🇷</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#FF8A00] font-black">
                  <Star size={18} fill="#FF8A00" /> 4.8
                </div>
                <span className="text-sm font-bold text-text-main/30">(2)</span>
              </div>
              <span className="text-2xl font-black text-[#B36262]">₩120,000</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 mb-8">
          <div className="bg-[#EBE6DF]/40 p-1 rounded-2xl flex">
            <button 
              onClick={() => setActiveTab('info')}
              className={cn(
                "flex-1 py-3 text-sm font-black rounded-xl transition-all",
                activeTab === 'info' ? "bg-white text-text-main shadow-sm" : "text-text-main/30"
              )}
            >
              상세 정보
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "flex-1 py-3 text-sm font-black rounded-xl transition-all",
                activeTab === 'reviews' ? "bg-white text-text-main shadow-sm" : "text-text-main/30"
              )}
            >
              리뷰 (2)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-12">
          {activeTab === 'info' ? (
            <div className="space-y-10 animate-in fade-in duration-300">
               <div className="space-y-3">
                  <h3 className="text-lg font-black text-text-main italic">설명</h3>
                  <p className="text-sm font-bold text-text-main/60 leading-relaxed">
                    깊고 복합적인 향이 특징인 보르도의 명품 와인. 블랙커런트, 바이올렛, 삼나무 향이 어우러지며 실크같은 탄닌이 매력적인 와인입니다.
                  </p>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-black text-text-main italic">맛 프로필</h3>
                  <div className="bg-white rounded-[40px] p-8 border border-primary-100 shadow-sm space-y-4">
                     {['BODY', 'SWEET', 'ACID', 'TANNIN'].map((label) => (
                        <div key={label} className="flex items-center justify-between">
                           <span className="text-xs font-black text-text-main/60">{label}</span>
                           <div className="flex gap-1.5">
                              {[1, 2, 3, 4, 5].map((d) => (
                                 <div key={d} className={`w-2.5 h-2.5 rotate-45 ${d <= 4 ? 'bg-[#B36262]' : 'bg-primary-100'}`} />
                              ))}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="flex gap-2 flex-wrap">
                  <div className="bg-[#D95F63]/10 text-[#D95F63] px-5 py-2.5 rounded-full text-xs font-black border border-[#D95F63]/20">과일향</div>
                  <div className="bg-[#D95F63]/10 text-[#D95F63] px-5 py-2.5 rounded-full text-xs font-black border border-[#D95F63]/20">오크향</div>
               </div>

               {/* Flavor Radar Graph Placeholder */}
               <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-black text-text-main italic">취향 그래프</h3>
                  <div className="bg-white rounded-[40px] p-8 border border-primary-100 shadow-sm aspect-square flex items-center justify-center relative">
                     <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <div className="w-3/4 h-3/4 border-2 border-text-main rotate-45" />
                        <div className="w-1/2 h-1/2 border-2 border-text-main rotate-45" />
                     </div>
                     <span className="text-xs font-bold text-text-main/30 absolute top-4">탄닌</span>
                     <span className="text-xs font-bold text-text-main/30 absolute right-4 top-1/2 -translate-y-1/2">바디</span>
                     <span className="text-xs font-bold text-text-main/30 absolute bottom-4">과일</span>
                     <span className="text-xs font-bold text-text-main/30 absolute left-4 top-1/2 -translate-y-1/2">산미</span>
                     <div className="w-32 h-32 bg-[#D95F63]/20 border-2 border-[#D95F63] rounded-full blur-xl" />
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-end gap-6 mb-2">
                  <span className="text-6xl font-black text-text-main leading-none">4.5</span>
                  <div className="flex flex-col gap-2 flex-1">
                     <div className="flex gap-1 text-[#FF8A00] text-xl">
                        {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}
                        <span className="text-gray-200">★</span>
                     </div>
                     <span className="text-xs font-bold text-text-main/30">2개 리뷰</span>
                  </div>
               </div>

               <div className="space-y-4">
                  {[
                    { user: '화이트와인팬', rating: 4, text: '여름에 시원하게 마시면 최고! 상큼하고 깔끔해요.', date: '2026.01.05' },
                    { user: '와인뉴비', rating: 4, text: '초보자도 마시기 편한 와인이에요. 부담없는 맛!', date: '2025.12.20' }
                  ].map((review, i) => (
                    <div key={i} className="bg-white rounded-[32px] p-6 border border-primary-100 shadow-sm space-y-3 relative overflow-hidden">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl">🐶</div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-text-main">{review.user}</span>
                             <div className="flex text-[#FF8A00] text-xs">
                                {[1, 2, 3, 4].map(s => <span key={s}>★</span>)}
                                <span className="text-gray-100">★</span>
                             </div>
                          </div>
                       </div>
                       <p className="text-sm font-bold text-text-main leading-relaxed">{review.text}</p>
                       <span className="text-[10px] font-bold text-text-main/20 absolute bottom-4 right-6">{review.date}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Write Review Link */}
      {activeTab === 'reviews' && (
        <div className="fixed bottom-24 left-6 right-6 z-30">
           <Link href={`/review/write/${params.wineId}`}>
              <Button size="full" className="bg-[#D95F63] text-white font-black text-lg h-16 shadow-xl rounded-[32px]">
                 리뷰 작성하기
              </Button>
           </Link>
        </div>
      )}
    </div>
  );
}
