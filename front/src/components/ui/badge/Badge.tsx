import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'soft';
  className?: string;
}

export default function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-700 text-white',
    secondary: 'bg-primary-100 text-primary-700 font-bold',
    soft: 'bg-white/80 backdrop-blur-md text-text-main/60 border border-primary-100',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest leading-none',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
