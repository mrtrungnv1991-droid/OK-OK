import { api, ApiResponse } from './client';

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export const reviewsApi = {
  getProductReviews: async (productId: string): Promise<ApiResponse<{ reviews: ProductReview[] }>> => {
    return api.get<{ reviews: ProductReview[] }>(`/reviews/product/${productId}`);
  },

  submitReview: async (payload: {
    productId: string;
    rating: number;
    comment: string;
    orderId?: string;
  }): Promise<ApiResponse<{ review: ProductReview }>> => {
    return api.post<{ review: ProductReview }>('/reviews', payload);
  }
};
