'use client';

import WineCard from './WineCard';
import { Wine } from '../types/wine.types';
import LoadingSpinner from '@/components/common/loading-spinner/LoadingSpinner';

interface WineListProps {
  wines?: Wine[];
  isLoading?: boolean;
}

export default function WineList({ wines, isLoading }: WineListProps) {
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-2 gap-4">
      {wines?.map((wine) => (
        <WineCard key={wine.id} wine={wine} />
      ))}
    </div>
  );
}
