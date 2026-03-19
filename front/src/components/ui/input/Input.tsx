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
        {label && <label className="text-text-main/90 ml-1 text-sm font-bold">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'border-primary-100 text-text-main placeholder:text-text-main/30 focus:border-primary-500 focus:ring-primary-100/50 flex w-full rounded-2xl border-2 bg-white px-5 py-2.5 text-base transition-all focus:ring-4 focus:outline-none disabled:bg-gray-50 disabled:text-gray-300',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
              suffix && 'pr-12',
              className,
            )}
            {...props}
          />
          {suffix && <div className="absolute top-1/2 right-4 -translate-y-1/2">{suffix}</div>}
        </div>
        {error && <p className="ml-1 text-xs font-bold text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
