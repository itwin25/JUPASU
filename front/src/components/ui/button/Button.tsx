import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'full';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-900 text-white hover:bg-primary-700 disabled:bg-primary-100 disabled:text-gray-400',
      outline: 'border border-primary-900 text-primary-900 bg-transparent hover:bg-primary-100 disabled:border-gray-300 disabled:text-gray-300',
      ghost: 'bg-transparent text-primary-900 hover:bg-primary-100 disabled:text-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-100',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-6 py-3 text-base rounded-xl',
      lg: 'px-8 py-4 text-lg font-bold rounded-2xl',
      full: 'w-full py-4 text-base font-bold rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors active:scale-95 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
