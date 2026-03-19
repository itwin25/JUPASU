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
      md: 'p-6',
      lg: 'p-8',
    };

    const variants = {
      default: 'bg-white border border-primary-100 shadow-[0_4px_24px_rgba(51,34,17,0.03)]',
      soft: 'bg-primary-100/50 border-none',
      outlined: 'bg-transparent border-2 border-primary-100',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[2rem] transition-all',
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
