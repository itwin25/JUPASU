'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Search, User, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, path: '/home' },
  { icon: Camera, path: '/scan' },
  { icon: MessageCircle, path: '/chat', isCenter: true },
  { icon: Search, path: '/search' },
  { icon: User, path: '/mypage' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/chat' || pathname === '/mypage/taste') return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pb-[max(0rem,env(safe-area-inset-bottom))]">
      <div className="app-shell">
        <div className="border-primary-100/70 relative flex h-[4.7rem] items-center justify-between border-t bg-white/96 px-6 shadow-[0_-8px_22px_rgba(51,34,17,0.04)] backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.path);

            if (item.isCenter) {
              return (
                <div
                  key={item.path}
                  className="relative flex h-16 w-16 items-center justify-center"
                >
                  <Link
                    href={item.path}
                    className="border-background absolute -top-[1.45rem] flex h-[4.05rem] w-[4.05rem] items-center justify-center rounded-full border-[5px] bg-[#B36262] shadow-[0_10px_24px_rgba(179,98,98,0.28)] transition-all active:scale-95"
                  >
                    <item.icon size={24} className="text-white" />
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex min-w-0 flex-1 items-center justify-center py-2 transition-colors',
                  isActive ? 'text-[#B36262]' : 'text-text-main/40',
                )}
              >
                <item.icon
                  size={21}
                  className={cn(isActive ? 'stroke-[2.25px]' : 'stroke-[1.85px]')}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
