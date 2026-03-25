export interface Review {
  id: number;
  wineId: number;
  userId: number;
  userNickname: string;
  rating: number;
  content: string;
  createdAt: string;
  images?: string[];
}

export interface MyPageReview {
  reviewId: number;
  nickname: string;
  wineId: number;
  wineName: string;
  wineImageUrl?: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  wineId: number;
  rating: number;
  content: string;
  images?: string[];
}

export interface UpdateReviewRequest {
  wineId: number;
  reviewId: number;
  rating: number;
  content: string;
}

export interface DeleteReviewRequest {
  wineId: number;
  reviewId: number;
}
