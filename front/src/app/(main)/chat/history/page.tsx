'use client';

import { ChevronLeft, Home, Scan, Search, User, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const HISTORY_DATA = [
  {
    id: 1,
    role: 'bot',
    text: '달콤한 와인을 좋아하시는군요! 모스카토 다스티나 리슬링같은 와인이 딱입니다. 과일 디저트랑 같이 드시면 환상이에요!',
    avatar: '👨‍🍳'
  },
  {
    id: 2,
    role: 'user',
    text: '감사합니다.',
    avatar: '🐶'
  }
];

export default function ChatHistoryPage() {
  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col pb-24">
      {/* Header */}
      <header className="flex items-center px-6 py-6 sticky top-0 bg-[#F9F7F2]/80 backdrop-blur-md z-10">
        <Link href="/chat" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-primary-100">
          <ChevronLeft size={24} className="text-text-main" />
        </Link>
      </header>

      {/* History List */}
      <main className="flex-1 px-6 space-y-8">
        {HISTORY_DATA.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-12 h-12 bg-[#8B4513]/10 rounded-full flex items-center justify-center text-2xl shrink-0">
              {item.avatar}
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-sm font-black text-[#8B4513] ml-1">
                {item.role === 'bot' ? '소믈리에' : '나'}
              </span>
              <div className={cn(
                "p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm",
                item.role === 'bot' 
                  ? "bg-[#FFF9EB] text-text-main border border-[#FFD700]/20 rounded-tl-none" 
                  : "bg-white text-text-main border border-primary-100 rounded-tr-none"
              )}>
                {item.text}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Re-using BottomNav logic but statically for this view if needed */}
    </div>
  );
}
