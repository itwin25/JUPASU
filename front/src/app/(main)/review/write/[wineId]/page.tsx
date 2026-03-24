'use client';

import { ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Button from '@/components/ui/button/Button';
import { useState } from 'react';

export default function ReviewWritePage() {
  const params = useParams<{ wineId: string }>();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  return (
    <div className="bg-background flex min-h-screen flex-col px-6 pt-10 pb-12">
      {/* Header */}
      <header className="mb-10 flex items-center gap-4">
        <Link
          href={`/wines/${params.wineId}`}
          className="border-primary-100 flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm"
        >
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
        <h1 className="text-text-main text-xl font-black">리뷰 작성</h1>
      </header>

      <main className="flex-1 space-y-10">
        {/* Wine Info Card */}
        <div className="border-primary-100 flex items-center gap-4 rounded-[32px] border bg-white p-6 shadow-sm">
          <div className="h-20 w-20 shrink-0 rounded-2xl bg-[#EBE6DF]" />
          <div className="space-y-0.5">
            <h2 className="text-text-main text-lg leading-tight font-black">Cloudy Bay</h2>
            <p className="text-text-main/40 text-sm font-bold">Sauvignon Blanc</p>
          </div>
        </div>

        {/* Rating Selection */}
        <div className="space-y-4 text-center">
          <span className="text-text-main text-base font-black">별점을 선택해주세요</span>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="text-4xl transition-transform active:scale-90"
              >
                <Star
                  size={48}
                  className={s <= rating ? 'fill-[#FF8A00] text-[#FF8A00]' : 'text-gray-200'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Review Textarea */}
        <div className="space-y-4">
          <span className="text-text-main text-base font-black">리뷰를 작성해주세요</span>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 500))}
              className="border-primary-100 focus:border-primary-500 placeholder:text-text-main/20 h-48 w-full resize-none rounded-[32px] border-2 bg-white p-6 text-sm font-bold transition-colors focus:outline-none"
              placeholder="이 와인은 어떠셨나요? 맛, 향, 분위기 등..."
            />
            <span className="text-text-main/30 absolute right-6 bottom-6 text-[10px] font-bold">
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
          className="h-16 rounded-[32px] bg-[#D95F63] text-lg font-black text-white shadow-lg disabled:bg-gray-200"
        >
          리뷰 등록하기
        </Button>
       
      </div>
    </div>
  );
}
