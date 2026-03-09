'use client';

import { ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/button/Button';
import { useState } from 'react';

export default function ReviewWritePage({ params }: { params: { wineId: string } }) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pb-12 pt-10">
      {/* Header */}
      <header className="flex items-center gap-4 mb-10">
        <Link href={`/wines/${params.wineId}`} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
        <h1 className="text-xl font-black text-text-main">리뷰 작성</h1>
      </header>

      <main className="flex-1 space-y-10">
        {/* Wine Info Card */}
        <div className="bg-white rounded-[32px] p-6 flex gap-4 items-center border border-primary-100 shadow-sm">
           <div className="w-20 h-20 bg-[#EBE6DF] rounded-2xl shrink-0" />
           <div className="space-y-0.5">
              <h2 className="font-black text-lg text-text-main leading-tight">Cloudy Bay</h2>
              <p className="text-sm text-text-main/40 font-bold">Sauvignon Blanc</p>
           </div>
        </div>

        {/* Rating Selection */}
        <div className="space-y-4 text-center">
           <span className="text-base font-black text-text-main">별점을 선택해주세요</span>
           <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button 
                  key={s} 
                  onClick={() => setRating(s)}
                  className="text-4xl transition-transform active:scale-90"
                >
                  <Star 
                    size={48} 
                    className={s <= rating ? "text-[#FF8A00] fill-[#FF8A00]" : "text-gray-200"} 
                  />
                </button>
              ))}
           </div>
        </div>

        {/* Review Textarea */}
        <div className="space-y-4">
           <span className="text-base font-black text-text-main">리뷰를 작성해주세요</span>
           <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 500))}
                className="w-full h-48 bg-white border-2 border-primary-100 rounded-[32px] p-6 text-sm font-bold focus:outline-none focus:border-primary-500 transition-colors placeholder:text-text-main/20 resize-none"
                placeholder="이 와인은 어떠셨나요? 맛, 향, 분위기 등..."
              />
              <span className="absolute bottom-6 right-6 text-[10px] font-bold text-text-main/30">
                {content.length}/500
              </span>
           </div>
        </div>
      </main>

      {/* Submit Button */}
      <div className="space-y-4 pt-6">
        <Button 
          size="full" 
          disabled={content.length < 10 || rating === 0}
          className="h-16 text-lg font-black bg-[#D95F63] text-white rounded-[32px] shadow-lg disabled:bg-gray-200"
        >
          리뷰 등록하기
        </Button>
        <p className="text-[10px] font-bold text-text-main/30 text-center">
          별점과 10자 이상의 리뷰를 작성해주세요
        </p>
      </div>
    </div>
  );
}
