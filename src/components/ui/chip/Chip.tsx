import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function Chip({ className, active = false, variant = 'primary', children, ...props }: ChipProps) {
  const activeStyles = active 
    ? 'bg-primary-900 text-white border-primary-900' 
    : 'bg-white text-text-main border-gray-200 hover:bg-gray-50';

  return (
    <button
      className={cn(
        'px-4 py-1.5 text-sm font-medium rounded-full border transition-all active:scale-95',
        activeStyles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
