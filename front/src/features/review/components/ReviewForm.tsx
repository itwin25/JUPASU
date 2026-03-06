'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import Textarea from '@/components/ui/textarea/Textarea';
import Button from '@/components/ui/button/Button';
import { useCreateReviewMutation } from '../hooks/useWineReviewsQuery';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  wineId: number;
}

export default function ReviewForm({ wineId }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const { mutate: create, isPending } = useCreateReviewMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('평점을 선택해주세요.');
    create({ wineId, rating, content });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center gap-2 py-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button 
            key={star} 
            type="button" 
            onClick={() => setRating(star)}
            className="transition-transform active:scale-125"
          >
            <Star 
              size={32} 
              className={cn(
                "transition-colors",
                star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )} 
            />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="와인에 대한 솔직한 후기를 남겨주세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <Button type="submit" size="full" isLoading={isPending}>
        리뷰 등록하기
      </Button>
    </form>
  );
}
