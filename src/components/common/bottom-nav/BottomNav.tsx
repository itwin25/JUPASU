'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Camera, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTE_PATH } from '@/constants/route-path';

const NAV_ITEMS = [
  { icon: Home, label: '홈', path: ROUTE_PATH.HOME },
  { icon: Search, label: '검색', path: ROUTE_PATH.WINE_SEARCH },
  { icon: Camera, label: '스캔', path: '/scan' },
  { icon: MessageCircle, label: '챗봇', path: ROUTE_PATH.CHATBOT },
  { icon: User, label: '마이', path: ROUTE_PATH.MY_PAGE },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-gray-100 bg-background/95 backdrop-blur-md pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                isActive ? "text-primary-900" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
