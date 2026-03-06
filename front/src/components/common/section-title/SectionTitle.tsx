import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export default function SectionTitle({ title, rightSlot, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-end justify-between mb-5 mt-2 px-1", className)}>
      <h2 className="text-xl font-extrabold text-text-main tracking-tight">
        {title}
      </h2>
      {rightSlot && (
        <div className="text-sm font-bold text-primary-700 active:opacity-60 transition-opacity">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
