'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Card from '@/components/ui/card/Card';
import { Review } from '../types/review.types';
import Image from 'next/image';

const DEFAULT_WINE_IMAGE_URL = '/default_wine.png';

interface ReviewCardProps {
  review: Review;
  wineImageUrl?: string;
}

export default function ReviewCard({ review, wineImageUrl }: ReviewCardProps) {
  const [imageSrc, setImageSrc] = useState(DEFAULT_WINE_IMAGE_URL);

  useEffect(() => {
    if (wineImageUrl && wineImageUrl !== '/images/default_wine.png') {
      setImageSrc(wineImageUrl);
    } else {
      setImageSrc(DEFAULT_WINE_IMAGE_URL);
    }
  }, [wineImageUrl]);

  return (
    <Card className="space-y-2 overflow-hidden">
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 w-0">
         <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white">
          <div className="relative h-4 w-4">
            <Image
              src={imageSrc}
              alt="wine"
              fill
              className="object-contain"
              onError={() => setImageSrc(DEFAULT_WINE_IMAGE_URL)}
              unoptimized
            />
          </div>
        </div>

          <span className="block min-w-0 flex-1 truncate text-sm font-bold text-text-main">
            {review.userNickname}
          </span>
        </div>

        <div className="flex shrink-0 gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-200'
              }
            />
          ))}
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-text-main/80 break-words">
        {review.content}
      </p>

      <div className="mt-2 text-[10px] text-text-main/40">
        {review.createdAt}
      </div>
    </Card>
  );
}