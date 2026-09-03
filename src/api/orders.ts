import { api, ApiResponse } from './client';
import { UserOrder } from '../types';

export const ordersApi = {
  getUserOrders: async (): Promise<ApiResponse<{ orders: UserOrder[] }>> => {
    return api.get<{ orders: UserOrder[] }>('/orders');
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<{ order: UserOrder }>> => {
    return api.get<{ order: UserOrder }>(`/orders/${orderId}`);
  },

  instantBuy: async (payload: { productId: string; idempotencyKey?: string }): Promise<ApiResponse<{ order: UserOrder; deliveredKey: string; message: string }>> => {
    return api.post<{ order: UserOrder; deliveredKey: string; message: string }>('/orders/instant-buy', payload);
  },

  topupGame: async (payload: {
    gameId: string;
    tierId: string;
    uid: string;
    zoneId?: string;
    server?: string;
    characterName?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{ order: UserOrder; message: string }>> => {
    return api.post<{ order: UserOrder; message: string }>('/orders/topup-game', payload);
  }
};
