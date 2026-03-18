import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'full';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props },
    ref,
  ) => {
    const variants = {
      primary:
        'bg-primary-700 text-white shadow-[0_10px_24px_rgba(179,98,98,0.24)] hover:bg-primary-900 disabled:bg-primary-100 disabled:text-gray-400 disabled:shadow-none',
      secondary:
        'bg-primary-100/90 text-text-main shadow-[0_8px_18px_rgba(51,34,17,0.05)] hover:bg-primary-100 disabled:bg-gray-100 disabled:text-text-main/35 disabled:shadow-none',
      outline:
        'border border-primary-500/65 bg-white/70 text-primary-700 hover:bg-primary-100/70 disabled:border-gray-200 disabled:text-text-main/30',
      ghost: 'bg-transparent text-primary-700 hover:bg-primary-100/50 shadow-none',
      icon: 'rounded-full border border-primary-100/80 bg-white/88 p-2.5 text-text-main shadow-[0_6px_18px_rgba(51,34,17,0.05)] hover:bg-white active:scale-95',
    };

    const sizes = {
      sm: 'min-h-10 rounded-full px-4 text-sm font-semibold',
      md: 'min-h-[3.25rem] rounded-2xl px-5 text-[15px] font-bold',
      lg: 'min-h-14 rounded-[1.35rem] px-6 text-base font-extrabold',
      full: 'min-h-[3.35rem] w-full rounded-[1.35rem] px-5 text-[15px] font-bold',
      icon: '',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 active:scale-[0.985] disabled:pointer-events-none',
          variants[variant],
          variant !== 'icon' && sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          </div>
        ) : null}
        <span className={cn('flex items-center justify-center gap-2', isLoading && 'invisible')}>
          {children}
        </span>
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
