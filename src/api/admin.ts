import { api, ApiResponse } from './client';

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalTransactions: number;
  totalRevenue: number;
  totalEscrowHeld: number;
  activePoolsCount: number;
  totalProducts: number;
  totalGames: number;
  systemStatus: string;
}

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  timestamp: string;
}

export const adminApi = {
  getDashboardStats: async (): Promise<ApiResponse<{ stats: AdminStats }>> => {
    return api.get<{ stats: AdminStats }>('/admin/dashboard');
  },

  getAuditLogs: async (limit?: number): Promise<ApiResponse<{ logs: AdminAuditLog[] }>> => {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<{ logs: AdminAuditLog[] }>(`/admin/audit-logs${query}`);
  },

  getUsers: async (): Promise<ApiResponse<{ users: any[] }>> => {
    return api.get<{ users: any[] }>('/admin/users');
  },

  updateUserRole: async (userId: string, role: string): Promise<ApiResponse<{ user: any }>> => {
    return api.put<{ user: any }>(`/admin/users/${userId}/role`, { role });
  },

  getSystemConfig: async (): Promise<ApiResponse<{ config: any }>> => {
    return api.get<{ config: any }>('/admin/system-config');
  },

  // CYBERPOOL FIX: category CRUD — persist tab Danh Mục xuống server
  getCategories: async (): Promise<ApiResponse<{ categories: any[] }>> => {
    return api.get<{ categories: any[] }>('/admin/categories');
  },

  createCategory: async (category: any): Promise<ApiResponse<{ category: any; categories: any[] }>> => {
    return api.post<{ category: any; categories: any[] }>('/admin/categories', category);
  },

  updateCategory: async (id: string, category: any): Promise<ApiResponse<{ category: any; categories: any[] }>> => {
    return api.put<{ category: any; categories: any[] }>(`/admin/categories/${id}`, category);
  },

  deleteCategory: async (id: string): Promise<ApiResponse<{ removedCount: number; categories: any[] }>> => {
    return api.delete<{ removedCount: number; categories: any[] }>(`/admin/categories/${id}`);
  },

  // CYBERPOOL FIX: withdrawal lifecycle — approve/reject có hoàn tiền qua ledger
  getWithdrawals: async (status?: string): Promise<ApiResponse<{ withdrawals: any[] }>> => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return api.get<{ withdrawals: any[] }>(`/admin/withdrawals${query}`);
  },

  approveWithdrawal: async (id: string, note?: string): Promise<ApiResponse<{ withdrawal: any }>> => {
    return api.post<{ withdrawal: any }>(`/admin/withdrawals/${id}/approve`, { note: note || '' });
  },

  rejectWithdrawal: async (id: string, reason: string): Promise<ApiResponse<{ withdrawal: any; refunded: boolean }>> => {
    return api.post<{ withdrawal: any; refunded: boolean }>(`/admin/withdrawals/${id}/reject`, { reason });
  },

  updateSystemConfig: async (config: any): Promise<ApiResponse<{ config: any }>> => {
    return api.put<{ config: any }>('/admin/system-config', config);
  },

  testCard24h: async (credentials?: { partnerId?: string; partnerKey?: string }): Promise<ApiResponse<any>> => {
    return api.post<any>('/admin/test-card24h', credentials || {});
  },

  testBinance: async (credentials?: { apiKey?: string; secretKey?: string }): Promise<ApiResponse<any>> => {
    return api.post<any>('/admin/test-binance', credentials || {});
  },

  testCryptoUsdt: async (params?: { address?: string; network?: string }): Promise<ApiResponse<any>> => {
    return api.post<any>('/admin/test-crypto-usdt', params || {});
  },

  testLtc: async (params?: { address?: string }): Promise<ApiResponse<any>> => {
    return api.post<any>('/admin/test-ltc', params || {});
  },

  testMoMo: async (params?: { phone?: string; name?: string }): Promise<ApiResponse<any>> => {
    return api.post<any>('/admin/test-momo', params || {});
  }
};
