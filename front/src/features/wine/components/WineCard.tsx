import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import Card from '@/components/ui/card/Card';
import Badge from '@/components/ui/badge/Badge';
import { Wine } from '../types/wine.types';
import { ROUTE_PATH } from '@/constants/route-path';

interface WineCardProps {
  wine: Wine;
}

export default function WineCard({ wine }: WineCardProps) {
  const displayName = wine.nameKr || wine.nameEn;

  return (
    <Link href={ROUTE_PATH.WINE_DETAIL(wine.id)}>
      <Card padding="none" className="flex h-full flex-col overflow-hidden">
        <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-white p-4">
          <div className="relative h-full w-full">
            <Image
              src={wine.imageUrl || '/images/wine-placeholder.png'}
              alt={displayName}
              fill
              className="object-contain"
            />
          </div>
        </div>
        <div className="space-y-1 p-3">
          <Badge variant="primary" className="mb-1">
            {wine.type}
          </Badge>
          <h3 className="text-text-main line-clamp-1 text-sm font-bold">{displayName}</h3>
          <p className="text-text-main/50 line-clamp-1 text-xs">{wine.country}</p>
          <div className="mt-1 flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{wine.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-primary-900 mt-1 text-sm font-bold">₩{wine.price.toLocaleString()}</p>
        </div>
      </Card>
    </Link>
  );
}
