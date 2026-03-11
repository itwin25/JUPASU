import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-semibold text-text-main/70 ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'flex min-h-[140px] w-full rounded-2xl border border-primary-100 bg-white px-5 py-4 text-base text-text-main transition-all placeholder:text-text-main/30',
            'focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100',
            'disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-500/10',
            className,
          )}
          {...props}
        />
        {(error || helperText) && (
          <p className={cn('text-xs ml-1', error ? 'text-red-500 font-medium' : 'text-text-main/40')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
