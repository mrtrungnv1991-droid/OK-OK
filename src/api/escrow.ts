import { api, ApiResponse } from './client';

export interface EscrowPool {
  id: string;
  productId: string;
  poolId: string;
  targetSlots: number;
  filledSlots: number;
  pricePerSlot: number;
  totalLockedAmount: number;
  status: 'FILLING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  expiresAt: string;
  participants: Array<{
    userId: string;
    userName: string;
    avatar: string;
    joinedAt: string;
    slotNumber: number;
    deliveredKey?: string;
  }>;
  createdAt: string;
}

export const escrowApi = {
  getPools: async (): Promise<ApiResponse<{ pools: EscrowPool[] }>> => {
    return api.get<{ pools: EscrowPool[] }>('/escrow/pools');
  },

  joinPool: async (payload: { poolId: string; productId: string; idempotencyKey?: string }): Promise<ApiResponse<{ pool: EscrowPool; message: string }>> => {
    return api.post<{ pool: EscrowPool; message: string }>('/escrow/join', payload);
  },

  adminForceRefund: async (poolId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post<{ message: string }>('/escrow/admin/refund', { poolId });
  }
};
