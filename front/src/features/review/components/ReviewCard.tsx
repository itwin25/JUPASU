import { Star } from 'lucide-react';
import Card from '@/components/ui/card/Card';
import { Review } from '../types/review.types';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm text-text-main">{review.userNickname}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} 
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-text-main/80 leading-relaxed line-clamp-3">
        {review.content}
      </p>
      <div className="text-[10px] text-text-main/40 mt-2">
        {review.createdAt}
      </div>
    </Card>
  );
}
