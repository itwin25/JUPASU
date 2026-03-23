import { api } from '@/lib/axios';
import {
  CreateReviewRequest,
  DeleteReviewRequest,
  MyPageReview,
  Review,
  UpdateReviewRequest,
} from '../types/review.types';
import { ApiResponse } from '@/types/api.types';

export const reviewApi = {
  // 마이페이지 리뷰 (기존 컨트롤러 명세를 따름)
  getMyReviews: () =>
    api.get<ApiResponse<MyPageReview[]>>('/users/reviews').then((res) => res.data.data),

  // [GET] 와인 리뷰 목록 조회
  getWineReviews: (wineId: string | number) =>
    api
      .get(`/reviews/${wineId}`)
      .then((res) => {
        // 백엔드는 ApiResponse 안에 Page 객체로 반환하므로 res.data.data.content 로 접근
        const content = res.data.data?.content ?? [];
        
        // 백엔드의 ReviewResponse 필드명을 프론트엔드 Review 타입에 맞춰 매핑
        return content.map((item: any): Review => ({
          id: item.reviewId,           // backend: reviewId -> frontend: id
          wineId: Number(wineId),
          userId: item.userId,
          userNickname: item.nickname, // backend: nickname -> frontend: userNickname
          rating: item.rating,
          content: item.content,
          createdAt: item.createdAt,
        }));
      }),

  // [POST] 리뷰 생성
  create: (data: CreateReviewRequest) => {
    const payload = {
      rating: Number(data.rating),
      content: data.content.trim() === '' ? ' ' : data.content,
    };
    return api.post(`/reviews/${data.wineId}/review`, payload).then((res) => res.data);
  },

  // [PATCH] 리뷰 수정
  update: ({ wineId, reviewId, rating, content }: UpdateReviewRequest) =>
    api
      .patch(`/reviews/${wineId}/review/${reviewId}`, { rating, content })
      .then((res) => res.data),

  // [DELETE] 리뷰 삭제
  delete: ({ wineId, reviewId }: DeleteReviewRequest) =>
    api.delete(`/reviews/${wineId}/review/${reviewId}`).then((res) => res.data),
};