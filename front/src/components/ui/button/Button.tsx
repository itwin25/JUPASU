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
        'bg-primary-700 text-white hover:bg-primary-900 disabled:bg-primary-100 disabled:text-gray-400',
      secondary: 'bg-primary-100 text-text-main hover:bg-primary-100/80 disabled:bg-gray-100',
      outline:
        'border-2 border-primary-500 text-primary-700 bg-transparent hover:bg-primary-100 disabled:border-gray-200',
      ghost: 'bg-transparent text-primary-700 hover:bg-primary-100/50',
      icon: 'bg-white border border-primary-100 text-text-main hover:bg-gray-50 rounded-full p-2.5 shadow-sm active:scale-90',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-3.5 text-base rounded-2xl font-bold',
      lg: 'px-8 py-4.5 text-lg rounded-2xl font-extrabold',
      full: 'w-full py-3.5 text-base rounded-2xl font-bold',
      icon: '',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center transition-all active:scale-[0.98] disabled:pointer-events-none',
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
