import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', shadow = false, children, ...props }, ref) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-gray-100 bg-white',
          shadow && 'shadow-sm',
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
