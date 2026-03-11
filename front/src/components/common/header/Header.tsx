'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/button/Button';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

export default function Header({ 
  title, 
  showBackButton = true, 
  rightSlot, 
  transparent = false,
  className 
}: HeaderProps) {
  const router = useRouter();

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 flex w-full items-center justify-between px-4 h-16 transition-all",
        !transparent ? "bg-background/80 backdrop-blur-xl border-b border-primary-100/20" : "bg-transparent",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-1">
        {showBackButton && (
          <Button 
            variant="icon" 
            onClick={() => router.back()}
            className="border-none shadow-none bg-transparent -ml-2 hover:bg-primary-100/30"
          >
            <ChevronLeft size={28} className="text-text-main" />
          </Button>
        )}
        {title && (
          <h1 className="text-lg font-extrabold text-text-main tracking-tight">{title}</h1>
        )}
      </div>
      
      <div className="flex flex-1 justify-end items-center gap-2">
        {rightSlot}
      </div>
    </header>
  );
}
