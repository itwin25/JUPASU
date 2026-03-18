import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'soft' | 'outlined';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', variant = 'default', children, ...props }, ref) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    };

    const variants = {
      default:
        'border border-primary-100/85 bg-white/88 shadow-[0_10px_30px_rgba(51,34,17,0.05)] backdrop-blur-sm',
      soft: 'border border-primary-100/50 bg-primary-100/55 shadow-none',
      outlined: 'border border-primary-100 bg-transparent shadow-none',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[1.75rem] transition-all',
          variants[variant],
          paddings[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

export default Card;
