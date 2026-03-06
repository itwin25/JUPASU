import { cn } from '@/lib/utils';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ 
  icon = <PackageOpen size={48} className="text-gray-300" />, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-text-main">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-text-main/50 max-w-[240px]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
