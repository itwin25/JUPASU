import { cn } from '@/lib/utils';

interface PageTitleProps {
  title: string;
  description?: string;
  className?: string;
}

export default function PageTitle({ title, description, className }: PageTitleProps) {
  return (
    <div className={cn("space-y-2 mb-8 mt-2", className)}>
      <h1 className="text-3xl font-extrabold tracking-tight text-text-main leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-base text-text-main/50 font-medium leading-relaxed max-w-[80%]">
          {description}
        </p>
      )}
    </div>
  );
}
