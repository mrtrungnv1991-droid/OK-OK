import { api, ApiResponse } from './client';

export interface UserSession {
  id: string;
  device: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'USER' | 'SELLER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
  permissions?: string[];
  walletBalance: number;
  escrowLocked: number;
  affiliateEarnings: number;
  avatar: string;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
}

export const authApi = {
  getMe: async (): Promise<ApiResponse<{ user: AuthUser }>> => {
    return api.get<{ user: AuthUser }>('/auth/me');
  },

  login: async (email: string, password?: string): Promise<ApiResponse<{ token: string; user: AuthUser }>> => {
    return api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
  },

  register: async (payload: { email: string; name: string; password?: string; phone?: string }): Promise<ApiResponse<{ token: string; user: AuthUser }>> => {
    return api.post<{ token: string; user: AuthUser }>('/auth/register', payload);
  },

  logout: async (): Promise<ApiResponse> => {
    const res = await api.post('/auth/logout');
    api.setToken(null);
    return res;
  },

  getSessions: async (): Promise<ApiResponse<{ sessions: UserSession[] }>> => {
    return api.get<{ sessions: UserSession[] }>('/auth/sessions');
  },

  revokeSession: async (sessionId: string): Promise<ApiResponse> => {
    return api.delete(`/auth/sessions/${sessionId}`);
  },

  requestPasswordReset: async (email: string): Promise<ApiResponse> => {
    return api.post('/auth/forgot-password', { email });
  }
};
