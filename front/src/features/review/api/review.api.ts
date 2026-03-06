import { api } from '@/lib/axios';
import { API_PATH } from '@/constants/api-path';
import { Review, CreateReviewRequest } from '../types/review.types';
import { PaginatedResponse } from '@/types/api.types';

export const reviewApi = {
  getWineReviews: (wineId: string | number) => 
    api.get<PaginatedResponse<Review>>(API_PATH.REVIEW.LIST, { params: { wineId } }).then(res => res.data),
    
  create: (data: CreateReviewRequest) => 
    api.post(API_PATH.REVIEW.CREATE, data).then(res => res.data),
    
  update: (id: string | number, content: string) => 
    api.patch(API_PATH.REVIEW.DETAIL(id), { content }).then(res => res.data),
    
  delete: (id: string | number) => 
    api.delete(API_PATH.REVIEW.DETAIL(id)).then(res => res.data),
};
