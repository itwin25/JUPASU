'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import { ChevronLeft, Heart, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button/Button';

export default function WineDetailPage({ params: paramsPromise }: { params: Promise<{ wineId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24 no-scrollbar">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-6 bg-transparent">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100"
        >
          <ChevronLeft size={24} className="text-text-main" />
        </button>
        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 text-text-main">
          <Heart size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar pt-20">
        {/* Wine Hero Area */}
        <div className="px-6 pb-10">
          <div className="w-full aspect-square bg-[#EBE6DF] rounded-[20px] relative flex items-center justify-center overflow-hidden mb-8">
            <div className="relative w-40 h-64">
               {/* Wine Bottle Image Placeholder */}
               <div className="absolute inset-0 bg-[#B36262]/20 rounded-full blur-3xl scale-75" />
               <span className="absolute inset-0 flex items-center justify-center text-8xl">🍷</span>
            </div>
            <div className="absolute bottom-4 left-4 bg-[#B36262] text-white text-xs font-black px-5 py-2 rounded-full shadow-lg">
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
        <div className="px-4 mb-8">
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
                  <h3 className="text-lg font-black text-text-main">설명</h3>
                  <p className="text-md font-bold text-text-main/60 leading-relaxed">
                    깊고 복합적인 향이 특징인 보르도의 명품 와인. 블랙커런트, 바이올렛, 삼나무 향이 어우러지며 실크같은 탄닌이 매력적인 와인입니다.
                  </p>
               </div>

               <div className="space-y-4">
                  <h3 className="text-lg font-black text-text-main">맛 프로필</h3>
                  <div className="bg-white rounded-[20px] p-7 border border-primary-100 shadow-sm space-y-4">
                     {['BODY', 'SWEET', 'ACID', 'TANNIN'].map((label) => (
                        <div key={label} className="flex items-center justify-between">
                           <span className="text-sm font-black text-text-main/60">{label}</span>
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
                  <div className="bg-[#D65F69] text-white px-5 py-2.5 rounded-full text-xs font-black">과일향</div>
                  <div className="bg-[#D65F69] text-white px-5 py-2.5 rounded-full text-xs font-black">오크향</div>
               </div>

               {/* Flavor Radar Graph - Pentagon */}
               <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-black text-text-main">취향 그래프</h3>
                  <div className="bg-white rounded-[40px] p-8 border border-primary-100 shadow-sm aspect-square flex items-center justify-center relative">
                     <svg className="w-full h-full p-10 overflow-visible" viewBox="0 0 100 100">
                        {/* Pentagon Grid */}
                        {[20, 40, 60, 80, 100].map((r) => {
                           const points = Array.from({ length: 5 }).map((_, i) => {
                              const angle = (i * 72 - 90) * (Math.PI / 180);
                              return `${50 + (r/2) * Math.cos(angle)},${50 + (r/2) * Math.sin(angle)}`;
                           }).join(' ');
                           return <polygon key={r} points={points} className="fill-none stroke-primary-100 stroke-[0.5]" />;
                        })}
                        {/* Axis lines */}
                        {Array.from({ length: 5 }).map((_, i) => {
                           const angle = (i * 72 - 90) * (Math.PI / 180);
                           return <line key={i} x1="50" y1="50" x2={50 + 50 * Math.cos(angle)} y2={50 + 50 * Math.sin(angle)} className="stroke-primary-100 stroke-[0.5]" />;
                        })}
                        {/* Data Polygon */}
                        <polygon 
                           points="50,15 85,40 75,85 25,85 15,40" 
                           className="fill-[#D65F69]/20 stroke-[#D65F69] stroke-2"
                        />
                     </svg>
                     
                     {/* Labels */}
                     <span className="text-[12px] font-black text-text-main/40 absolute top-10">탄닌</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute right-8 top-[38%]">산미</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute right-20 bottom-14">바디</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute left-20 bottom-14">당도</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute left-8 top-[38%]">도수</span>
                  </div>
               </div>
               {/* Food Pairing */}
               <div className="space-y-4">
                  <h3 className="text-lg font-black text-text-main">음식 페어링</h3>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2">
                     {['스테이크', '치즈', '파스타', '초콜릿', '해산물'].map((food) => (
                        <div key={food} className="flex-shrink-0 bg-[#EAE0D5] rounded-xl px-6 py-2.5 flex items-center justify-center min-w-[90px]">
                           <span className="text-xs font-black text-[#333333]">{food}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Similar Wine Recommendations - Refined Layout */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-text-main">유사한 와인 추천</h3>
                    <button className="text-[10px] font-bold text-text-main/30 underline uppercase tracking-widest">View All</button>
                  </div>
                  <div className="flex flex-col gap-3">
                     {[
                       { id: 2, name: 'Chateau Latour', desc: '강한 탄닌과 묵직한 바디감이 특징인 명품 레드', price: '150,000', rating: 4.9, match: 92 },
                       { id: 3, name: 'Petrus 2015', desc: '부드러운 질감과 우아한 향의 보르도 정점', price: '2,400,000', rating: 5.0, match: 88 },
                       { id: 4, name: 'Opus One', desc: '나파 밸리의 정수를 담은 균형 잡힌 블렌딩', price: '680,000', rating: 4.7, match: 90 }
                     ].map((wine) => (
                        <Link key={wine.id} href={`/wines/${wine.id}`} className="bg-white border border-primary-100 rounded-[20px] p-4 flex items-start gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden">
                           {/* Left: Wine Image */}
                           <div className="w-16 h-24 bg-[#EBE6DF] rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-4xl opacity-40">🍷</span>
                           </div>
                           
                           {/* Center: Content (Name, Desc, Price) aligned */}
                           <div className="flex-1 min-w-0 pr-16 space-y-1.5 self-center">
                              <h4 className="text-sm font-black text-text-main truncate">{wine.name}</h4>
                              <p className="text-[10px] font-bold text-text-main/40 leading-tight line-clamp-2">{wine.desc}</p>
                              <div className="flex items-center gap-2 pt-0.5">
                                 <span className="text-[11px] font-black text-[#B36262]">₩{wine.price}</span>
                                 <div className="flex items-center gap-0.5 text-[#FF8A00] font-black text-[10px]">
                                    <Star size={10} fill="#FF8A00" /> {wine.rating}
                                 </div>
                              </div>
                           </div>

                           {/* Right Top: Match Percentage */}
                           <div className="absolute top-4 right-4 shrink-0">
                              <div className="bg-[#B36262] text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm">
                                 {wine.match}%
                              </div>
                           </div>
                        </Link>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="flex items-end gap-6 mb-2">
                  <span className="text-6xl font-black text-text-main leading-none">4.5</span>
                  <div className="flex flex-col gap-2 flex-1">
                     <div className="flex gap-1 text-[#FF8A00] text-xl">
                        {[1, 2, 3, 4].map(s => <Star key={s} size={20} fill="#FF8A00" />)}
                        <Star size={20} className="text-gray-200" fill="currentColor" />
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
                             <div className="flex text-[#FF8A00]">
                                {[1, 2, 3, 4].map(s => <Star key={s} size={12} fill="#FF8A00" />)}
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
