'use client';

import { useState, useEffect } from 'react';
import { X, Star, Trash2, ChevronLeft } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; content: string }) => void;
  onDelete?: () => void;
  initialData?: { rating: number; content: string };
  wineInfo: { name: string; category: string; image?: string };
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  wineInfo,
}: ReviewModalProps) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [content, setContent] = useState(initialData?.content || '');
  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating || 0);
      setContent(initialData?.content || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isValid = rating > 0 && content.length >= 10;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-background sm:rounded-[40px] rounded-t-[40px] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300 h-[90vh] sm:h-auto sm:max-h-[85vh]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 sticky top-0 bg-background z-10">
          <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
            <ChevronLeft size={24} className="text-text-main" />
          </button>
          <h2 className="text-xl font-black text-text-main">
            {isEdit ? '리뷰 수정' : '리뷰 작성'}
          </h2>
          {isEdit ? (
            <button 
              onClick={onDelete}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100 text-red-400"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-10 no-scrollbar">
          {/* Wine Info Card */}
          <div className="bg-white rounded-[32px] p-6 flex gap-4 items-center border border-primary-100 shadow-sm relative">
             <div className="w-20 h-20 bg-[#EBE6DF] rounded-2xl shrink-0 flex items-center justify-center text-3xl">
                🍷
             </div>
             <div className="space-y-0.5">
                <h3 className="font-black text-lg text-text-main leading-tight">{wineInfo.name}</h3>
                <p className="text-sm text-text-main/40 font-bold">{wineInfo.category}</p>
             </div>
             {isEdit && (
               <span className="absolute top-4 right-6 text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-1 rounded-md">수정 중</span>
             )}
          </div>

          {/* Rating Selection */}
          <div className="space-y-4 text-center">
             <span className="text-base font-black text-text-main italic">별점을 선택해주세요</span>
             <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setRating(s)}
                    className="text-4xl transition-transform active:scale-90"
                  >
                    <Star 
                      size={48} 
                      className={cn(
                        "transition-colors",
                        s <= rating ? "text-[#D9AD70] fill-[#D9AD70]" : "text-gray-200"
                      )} 
                    />
                  </button>
                ))}
             </div>
          </div>

          {/* Review Textarea */}
          <div className="space-y-4">
             <span className="text-base font-black text-text-main italic">리뷰 내용</span>
             <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, 500))}
                  className="w-full h-48 bg-white border-2 border-primary-100 rounded-[32px] p-6 text-sm font-bold focus:outline-none focus:border-primary-500 transition-colors placeholder:text-text-main/20 resize-none shadow-sm"
                  placeholder="이 와인은 어떠셨나요? 맛, 향, 분위기 등..."
                />
                <span className="absolute bottom-6 right-6 text-[10px] font-bold text-text-main/30">
                  {content.length}/500
                </span>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 py-6 bg-background border-t border-primary-100 space-y-4">
          <Button 
            size="full" 
            onClick={() => onSubmit({ rating, content })}
            disabled={!isValid}
            className={cn(
              "h-16 text-lg font-black rounded-[32px] shadow-lg transition-all",
              isValid ? "bg-[#B36262] text-white" : "bg-gray-200 text-gray-400"
            )}
          >
            {isEdit ? '리뷰 수정하기' : '리뷰 등록하기'}
          </Button>
          {!isValid && (
            <p className="text-[10px] font-bold text-text-main/30 text-center uppercase tracking-widest">
              별점과 10자 이상의 리뷰를 작성해주세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
