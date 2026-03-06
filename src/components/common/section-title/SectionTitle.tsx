import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export default function SectionTitle({ title, rightSlot, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4 mt-2", className)}>
      <h2 className="text-lg font-bold text-text-main">
        {title}
      </h2>
      {rightSlot && (
        <div className="text-sm font-medium text-primary-700">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
