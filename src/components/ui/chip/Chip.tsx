import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export default function Chip({ className, active = false, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        'px-6 py-2 text-sm font-bold rounded-full border-2 transition-all active:scale-95 whitespace-nowrap',
        active 
          ? 'bg-primary-700 text-white border-primary-700 shadow-md' 
          : 'bg-white text-text-main/50 border-primary-100 hover:bg-primary-100/30',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
