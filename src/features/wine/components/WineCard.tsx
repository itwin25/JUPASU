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
  return (
    <Link href={ROUTE_PATH.WINE_DETAIL(wine.id)}>
      <Card padding="none" className="overflow-hidden flex flex-col h-full">
        <div className="relative aspect-[3/4] w-full bg-white flex items-center justify-center p-4">
          <div className="relative w-full h-full">
            <Image 
              src={wine.imageUrl || '/images/wine-placeholder.png'} 
              alt={wine.name}
              fill
              className="object-contain"
            />
          </div>
        </div>
        <div className="p-3 space-y-1">
          <Badge variant="primary" className="mb-1">{wine.type}</Badge>
          <h3 className="text-sm font-bold text-text-main line-clamp-1">{wine.name}</h3>
          <p className="text-xs text-text-main/50 line-clamp-1">{wine.origin}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{wine.rating.toFixed(1)}</span>
          </div>
          <p className="text-sm font-bold text-primary-900 mt-1">
            ₩{wine.price.toLocaleString()}
          </p>
        </div>
      </Card>
    </Link>
  );
}
