import { api, ApiResponse } from './client';
import { UserOrder } from '../types';

export const ordersApi = {
  getUserOrders: async (): Promise<ApiResponse<{ orders: UserOrder[] }>> => {
    return api.get<{ orders: UserOrder[] }>('/orders');
  },

  getAdminOrders: async (): Promise<ApiResponse<{ orders: UserOrder[] }>> => {
    return api.get<{ orders: UserOrder[] }>('/orders/admin/all');
  },

  getOrderById: async (orderId: string): Promise<ApiResponse<{ order: UserOrder }>> => {
    return api.get<{ order: UserOrder }>(`/orders/${orderId}`);
  },

  // CYBERPOOL FIX (#8 frontend audit): validate voucher với db.vouchers thật
  // trên server — client không còn hardcode mã/% sai lệch.
  validateVoucher: async (code: string, amount?: number): Promise<ApiResponse<{
    voucher: {
      code: string;
      discountType: 'percent' | 'fixed';
      discountValue: number;
      discountPercent: number;
      minOrderValue: number;
      maxDiscount?: number;
      expiresAt?: string;
    };
    discountAmount: number;
  }>> => {
    return api.post('/orders/vouchers/validate', { code, amount });
  },

  instantBuy: async (payload: { 
    productId: string; 
    quantity?: number; 
    paymentMethod?: 'wallet' | 'vietqr' | 'telco' | 'card';
    voucherCode?: string;
    finalTotal?: number;
    idempotencyKey?: string 
  }): Promise<ApiResponse<{ order: UserOrder; deliveredKey: string; message: string }>> => {
    return api.post<{ order: UserOrder; deliveredKey: string; message: string }>('/orders/instant-buy', payload);
  },

  topupGame: async (payload: {
    gameId: string;
    tierId: string;
    uid: string;
    zoneId?: string;
    server?: string;
    characterName?: string;
    mode?: 'instant_direct' | 'group_topup';
    idempotencyKey?: string;
  }): Promise<ApiResponse<{ order: UserOrder; message: string }>> => {
    return api.post<{ order: UserOrder; message: string }>('/orders/topup-game', payload);
  }
};
