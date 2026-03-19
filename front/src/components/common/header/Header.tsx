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
  className,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'page-gutter top-safe sticky top-0 z-40 flex h-[4.25rem] w-full items-center justify-between transition-all',
        !transparent
          ? 'border-primary-100/35 bg-background/78 border-b backdrop-blur-xl'
          : 'bg-transparent',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {showBackButton && (
          <Button
            variant="icon"
            onClick={() => router.back()}
            className="hover:bg-primary-100/30 -ml-2 h-11 w-11 border-none bg-transparent shadow-none"
          >
            <ChevronLeft size={24} className="text-text-main" />
          </Button>
        )}
        {title && (
          <h1 className="text-text-main truncate text-[1.05rem] font-extrabold tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">{rightSlot}</div>
    </header>
  );
}
