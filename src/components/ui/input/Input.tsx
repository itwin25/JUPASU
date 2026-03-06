import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-bold text-text-main/60 ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex w-full rounded-2xl border-2 border-primary-100 bg-white px-5 py-4 text-base text-text-main transition-all placeholder:text-text-main/20 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100/50 disabled:bg-gray-50 disabled:text-gray-300',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            className,
          )}
          {...props}
        />
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
