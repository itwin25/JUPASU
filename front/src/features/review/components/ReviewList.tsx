import ReviewCard from './ReviewCard';
import { Review } from '../types/review.types';
import EmptyState from '@/components/common/empty-state/EmptyState';

interface ReviewListProps {
  reviews?: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  if (!reviews || reviews.length === 0) {
    return <EmptyState title="첫 리뷰를 기다리고 있어요" description="이 와인에 대해 어떻게 생각하시나요?" />;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
