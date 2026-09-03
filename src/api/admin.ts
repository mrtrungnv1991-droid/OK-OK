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

  updateSystemConfig: async (config: any): Promise<ApiResponse<{ config: any }>> => {
    return api.put<{ config: any }>('/admin/system-config', config);
  }
};
