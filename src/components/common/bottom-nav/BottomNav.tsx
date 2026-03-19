'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Search, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: '홈', icon: Home, path: '/home' },
  { label: '스캔', icon: Camera, path: '/scan' },
  { label: '챗봇', icon: MessageCircle, path: '/chat', isCenter: true },
  { label: '검색', icon: Search, path: '/search' },
  { label: '마이', icon: User, path: '/mypage' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 챗봇 페이지(/chat)와 취향 설정 페이지(/mypage/taste)에서는 하단 탭을 표시하지 않음
  if (pathname === '/chat' || pathname === '/mypage/taste') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-primary-100 px-6 pb-safe pt-2 shadow-sm">
      <div className="flex items-center justify-between h-16 relative max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          
          if (item.isCenter) {
            return (
              <div key={item.path} className="relative w-16 h-16 flex items-center justify-center">
                <Link
                  href={item.path}
                  className="absolute -top-10 w-20 h-20 bg-[#B36262] rounded-full border-[8px] border-background flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  <item.icon size={36} className="text-white fill-white" />
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-3 transition-colors py-2',
                isActive ? 'text-[#B36262]' : 'text-gray-400'
              )}
            >
              <item.icon 
                size={26} 
                className={cn(
                  isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'
                )} 
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
