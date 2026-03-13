'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import { ChevronLeft, Heart, Star, MoreHorizontal, PenSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button/Button';
import ReviewModal from '@/features/review/components/ReviewModal';
import Link from 'next/link';

export default function WineDetailPage({ params: paramsPromise }: { params: Promise<{ wineId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{ id: number; rating: number; content: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating'>('recent');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const wineInfo = {
    name: 'Chateau Margaux',
    category: 'BORDEAUX RED',
    match: 95,
    rating: 4.5,
    reviewCount: 2,
    price: '120,000'
  };

  const handleOpenWriteModal = () => {
    setEditingReview(null);
    setIsReviewModalOpen(true);
  };

  const handleOpenEditModal = (review: any) => {
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
               <div className="absolute inset-0 bg-[#B36262]/20 rounded-full blur-3xl scale-75" />
               <span className="absolute inset-0 flex items-center justify-center text-8xl">🍷</span>
            </div>
            <div className="absolute bottom-4 left-4 bg-[#B36262] text-white text-xs font-black px-5 py-2 rounded-full shadow-lg">
              {wineInfo.match}% MATCH
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                 <p className="text-xs font-black text-[#B36262] uppercase tracking-widest">{wineInfo.category}</p>
                 <h1 className="text-3xl font-black text-text-main leading-tight">{wineInfo.name}</h1>
               </div>
               <div className="text-2xl">🇫🇷</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 text-[#FF8A00] font-black">
                  <Star size={18} fill="#FF8A00" /> {wineInfo.rating}
                </div>
                <span className="text-sm font-bold text-text-main/30">({wineInfo.reviewCount})</span>
              </div>
              <span className="text-2xl font-black text-[#B36262]">₩{wineInfo.price}</span>
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
              리뷰 ({wineInfo.reviewCount})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-12">
          {activeTab === 'info' ? (
            <div className="space-y-10 animate-in fade-in duration-300">
               {/* 1. Description */}
               <div className="space-y-3">
                  <h3 className="text-lg font-black text-text-main">설명</h3>
                  <p className="text-md font-bold text-text-main/60 leading-relaxed">
                    깊고 복합적인 향이 특징인 보르도의 명품 와인. 블랙커런트, 바이올렛, 삼나무 향이 어우러지며 실크같은 탄닌이 매력적인 와인입니다.
                  </p>
               </div>

               {/* 2. Taste Profile */}
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

               {/* 3. Tags */}
               <div className="flex gap-2 flex-wrap">
                  <div className="bg-[#D65F69] text-white px-5 py-2.5 rounded-full text-xs font-black">과일향</div>
                  <div className="bg-[#D65F69] text-white px-5 py-2.5 rounded-full text-xs font-black">오크향</div>
               </div>

               {/* 4. Flavor Radar Graph (Pentagon) */}
               <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-black text-text-main">취향 그래프</h3>
                  <div className="bg-white rounded-[40px] p-8 border border-primary-100 shadow-sm aspect-square flex items-center justify-center relative">
                     <svg className="w-full h-full p-10 overflow-visible" viewBox="0 0 100 100">
                        {[20, 40, 60, 80, 100].map((r) => {
                           const points = Array.from({ length: 5 }).map((_, i) => {
                              const angle = (i * 72 - 90) * (Math.PI / 180);
                              return `${50 + (r/2) * Math.cos(angle)},${50 + (r/2) * Math.sin(angle)}`;
                           }).join(' ');
                           return <polygon key={r} points={points} className="fill-none stroke-primary-100 stroke-[0.5]" />;
                        })}
                        {Array.from({ length: 5 }).map((_, i) => {
                           const angle = (i * 72 - 90) * (Math.PI / 180);
                           return <line key={i} x1="50" y1="50" x2={50 + 50 * Math.cos(angle)} y2={50 + 50 * Math.sin(angle)} className="stroke-primary-100 stroke-[0.5]" />;
                        })}
                        <polygon 
                           points="50,15 85,40 75,85 25,85 15,40" 
                           className="fill-[#D65F69]/20 stroke-[#D65F69] stroke-2"
                        />
                     </svg>
                     <span className="text-[12px] font-black text-text-main/40 absolute top-10">탄닌</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute right-8 top-[38%]">산미</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute right-20 bottom-14">바디</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute left-20 bottom-14">당도</span>
                     <span className="text-[12px] font-black text-text-main/40 absolute left-8 top-[38%]">도수</span>
                  </div>
               </div>

               {/* 5. Food Pairing */}
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

               {/* 6. Similar Wine Recommendations */}
               <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-text-main">유사한 와인 추천</h3>
                    <button className="text-[10px] font-bold text-text-main/30 underline uppercase tracking-widest">View All</button>
                  </div>
                  <div className="flex flex-col gap-3">
                     {[
                       { id: 2, name: 'Chateau Latour', desc: '강한 탄닌과 묵직한 바디감이 특징인 명품 레드', price: '150,000', rating: 4.9, match: 92 },
                       { id: 3, name: 'Petrus 2015', desc: '부드러운 질감과 우아한 향의 보르도 정점', price: '2,400,000', rating: 5.0, match: 88 }
                     ].map((wine) => (
                        <Link key={wine.id} href={`/wines/${wine.id}`} className="bg-white border border-primary-100 rounded-[20px] p-4 flex items-start gap-4 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden">
                           <div className="w-16 h-24 bg-[#EBE6DF] rounded-xl flex items-center justify-center shrink-0">
                              <span className="text-4xl opacity-40">🍷</span>
                           </div>
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
            <div className="space-y-6 animate-in fade-in duration-300">
               {/* 1. Rating Overview Card */}
               <div className="bg-white rounded-[32px] p-8 border border-primary-100 shadow-sm flex items-center gap-10 mb-2">
                  <div className="flex flex-col items-center gap-2">
                     <span className="text-6xl font-black text-text-main leading-none">4.5</span>
                     <div className="flex gap-0.5 text-[#FF8A00]">
                        {[1, 2, 3, 4].map(s => <Star key={s} size={16} fill="#FF8A00" />)}
                        <Star size={16} className="text-gray-200" fill="currentColor" />
                     </div>
                     <span className="text-xs font-bold text-text-main/30">2개 리뷰</span>
                  </div>
                  
                  <div className="flex-1 space-y-1.5">
                     {[5, 4, 3, 2, 1].map((level) => (
                        <div key={level} className="flex items-center gap-3">
                           <span className="text-[10px] font-bold text-text-main/30 min-w-[8px]">{level}</span>
                           <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                              <div 
                                 className="h-full bg-[#D9AD70] rounded-full" 
                                 style={{ width: level === 5 || level === 4 ? '60%' : '0%' }}
                              />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 2. Sort Dropdown & Write Button (Modified Layout) */}
               <div className="flex justify-end items-center gap-2 relative z-10">
                  <div className="relative">
                    <button 
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="bg-[#B36262] text-white text-[11px] font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      {sortOrder === 'recent' ? '최신순' : '별점 높은 순'}
                      <ChevronLeft size={14} className={cn("rotate-[270deg] transition-transform", isSortMenuOpen && "rotate-90")} />
                    </button>
                    
                    {isSortMenuOpen && (
                      <div className="absolute top-full mt-2 right-0 w-32 bg-white rounded-2xl shadow-xl border border-primary-100 p-1 z-30 animate-in slide-in-from-top-2 duration-200">
                         {[
                           { id: 'rating', label: '별점 높은 순' },
                           { id: 'recent', label: '최신순' }
                         ].map((item) => (
                           <button 
                             key={item.id}
                             onClick={() => {
                               setSortOrder(item.id as any);
                               setIsSortMenuOpen(false);
                             }}
                             className={cn(
                               "w-full text-left px-4 py-2.5 text-[11px] font-black rounded-xl transition-colors",
                               sortOrder === item.id ? "bg-primary-100 text-[#B36262]" : "text-text-main/60 hover:bg-gray-50"
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
                    className="bg-white border border-primary-100 text-[#B36262] p-2 rounded-xl shadow-sm hover:bg-primary-50 transition-colors"
                  >
                    <PenSquare size={18} />
                  </button>
               </div>

               {/* 3. Review List (Reduced spacing) */}
               <div className="space-y-3">
                  {[
                    { id: 1, user: '화이트와인팬', rating: 4, text: '여름에 시원하게 마시면 최고! 상큼하고 깔끔해요.', date: '2026.01.05', avatar: '🐶' },
                    { id: 2, user: '와인뉴비', rating: 4, text: '초보자도 마시기 편한 와인이에요. 부담없는 맛!', date: '2025.12.20', avatar: '🐶' }
                  ].map((review) => (
                    <div 
                      key={review.id} 
                      className={cn(
                        "bg-white rounded-[32px] p-6 border shadow-sm space-y-4 relative overflow-visible transition-colors",
                        review.id === 1 ? "border-[#B36262]/20" : "border-primary-100"
                      )}
                    >
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-xl overflow-hidden">
                                {review.avatar}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-text-main">{review.user}</span>
                                <div className="flex text-[#FF8A00] gap-0.5">
                                   {[1, 2, 3, 4].map(s => <Star key={s} size={12} fill="#FF8A00" />)}
                                   <Star size={12} className="text-gray-200" fill="currentColor" />
                                </div>
                             </div>
                          </div>
                          
                          {/* Review Action Menu (Centered content) */}
                          <div className="relative">
                             <button 
                               onClick={() => setActiveMenuId(activeMenuId === review.id ? null : review.id)}
                               className="p-2 text-text-main/30 hover:text-text-main transition-colors -mr-2"
                             >
                                <MoreHorizontal size={20} />
                             </button>
                             {activeMenuId === review.id && (
                               <div className="absolute top-8 right-0 w-20 bg-white rounded-xl shadow-xl border border-primary-100 p-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                                  <button 
                                    onClick={() => handleOpenEditModal(review)}
                                    className="w-full text-center py-2 text-xs font-black text-text-main hover:bg-gray-50 rounded-lg"
                                  >
                                    수정
                                  </button>
                                  <div className="h-px bg-primary-100/50 mx-1" />
                                  <button className="w-full text-center py-2 text-xs font-black text-red-400 hover:bg-red-50 rounded-lg">
                                    삭제
                                  </button>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <p className="text-sm font-bold text-text-main leading-relaxed pr-2">
                          {review.text}
                       </p>
                       
                       <div className="flex justify-end">
                          <span className="text-[10px] font-black text-text-main/20 italic">{review.date}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal (Integrated) */}
      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
        onDelete={handleReviewDelete}
        initialData={editingReview ? { rating: editingReview.rating, content: editingReview.content } : undefined}
        wineInfo={{ name: wineInfo.name, category: wineInfo.category }}
      />
    </div>
  );
}
