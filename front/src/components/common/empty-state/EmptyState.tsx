import { cn } from '@/lib/utils';
import { Wine } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ 
  icon = <Wine size={64} className="text-primary-100" />, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-16 text-center bg-white/40 rounded-[2.5rem] border border-dashed border-primary-100", className)}>
      <div className="mb-6 opacity-80">{icon}</div>
      <h3 className="text-xl font-bold text-text-main">{title}</h3>
      {description && (
        <p className="mt-3 text-base text-text-main/40 font-medium max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-8 w-full">{action}</div>}
    </div>
  );
}
