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

export interface CreateReviewRequest {
  wineId: number;
  rating: number;
  content: string;
  images?: string[];
}
