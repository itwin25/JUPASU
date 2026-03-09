'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Camera, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTE_PATH } from '@/constants/route-path';

const NAV_ITEMS = [
  { icon: Home, label: '홈', path: ROUTE_PATH.HOME },
  { icon: Search, label: '검색', path: ROUTE_PATH.WINE_SEARCH },
  { icon: MessageCircle, label: '챗봇', path: ROUTE_PATH.CHATBOT, isCenter: true },
  { icon: Camera, label: '스캔', path: '/scan' },
  { icon: User, label: '마이', path: ROUTE_PATH.MY_PAGE },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-primary-100 bg-background/95 backdrop-blur-xl pb-safe shadow-[0_-4px_24px_rgba(51,34,17,0.04)]">
      <div className="flex h-20 items-center justify-around px-2 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          
          if (item.isCenter) {
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className="flex flex-col items-center justify-center -mt-10 group"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all group-active:scale-90",
                  isActive ? "bg-primary-900" : "bg-primary-700"
                )}>
                  <item.icon size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <span className={cn(
                  "text-[10px] font-extrabold mt-2 tracking-tighter transition-colors",
                  isActive ? "text-primary-700" : "text-text-main/40"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all active:scale-95",
                isActive ? "text-primary-700" : "text-text-main/20 hover:text-text-main/40"
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.8 : 2} />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
