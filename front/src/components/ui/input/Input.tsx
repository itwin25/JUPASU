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
      <div className="w-full space-y-2">
        {label && (
          <label className="text-text-main/88 ml-1 text-[13px] font-bold tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'border-primary-100/90 text-text-main placeholder:text-text-main/34 focus:border-primary-500 focus:ring-primary-100/60 flex min-h-[3.35rem] w-full rounded-[1.35rem] border bg-white/92 px-4 py-3.5 text-[15px] shadow-[0_4px_14px_rgba(51,34,17,0.03)] transition-all focus:ring-4 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100/70',
              suffix && 'pr-12.5',
              className,
            )}
            {...props}
          />
          {suffix && (
            <div className="text-text-main/55 absolute top-1/2 right-4 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="ml-1 text-[11px] font-semibold text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
