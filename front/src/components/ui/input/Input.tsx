import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, disabled, suffix, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-bold text-text-main/90 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex w-full rounded-2xl border-2 border-primary-100 bg-white px-5 py-4 text-base text-text-main transition-all placeholder:text-text-main/30 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/50 disabled:bg-gray-50 disabled:text-gray-300',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
              suffix && 'pr-12',
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-bold ml-1">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
