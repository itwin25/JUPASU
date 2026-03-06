import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export default function PageTitle({ title, description, className }: PageTitleProps) {
  return (
    <div className={cn("space-y-1 mb-6", className)}>
      <h1 className="text-2xl font-bold tracking-tight text-text-main">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-text-main/60">
          {description}
        </p>
      )}
    </div>
  );
}
