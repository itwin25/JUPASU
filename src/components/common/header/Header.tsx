'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightSlot?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export default function Header({ 
  title, 
  showBackButton = true, 
  rightSlot, 
  className,
  transparent = false
}: HeaderProps) {
  const router = useRouter();

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 flex w-full items-center justify-between px-4 h-14 bg-background/80 backdrop-blur-md",
        transparent && "bg-transparent backdrop-blur-none",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        {showBackButton && (
          <button 
            onClick={() => router.back()}
            className="p-1 hover:bg-white/50 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-text-main" />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-bold text-text-main truncate">{title}</h1>
        )}
      </div>
      
      <div className="flex flex-1 justify-end">
        {rightSlot}
      </div>
    </header>
  );
}
