import ReviewCard from './ReviewCard';
import { Review } from '../types/review.types';
import EmptyState from '@/components/common/empty-state/EmptyState';

interface ReviewListProps {
  reviews?: Review[];
  wineImageUrl?: string; // ⭐️ 추가: 와인 이미지 URL
}

export default function ReviewList({ reviews, wineImageUrl }: ReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return <EmptyState title="첫 리뷰를 기다리고 있어요" description="이 와인에 대해 어떻게 생각하시나요?" />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard 
          key={review.id} 
          review={review} 
          wineImageUrl={wineImageUrl} // ⭐️ 추가: 카드에 이미지 전달
        />
      ))}
    </div>
  );
}