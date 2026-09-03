/**
 * Unified API Client for CyberPool Marketplace
 * Standardizes token handling, request ID, timeout, and response normalization.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  requestId?: string;
}

class ApiService {
  private token: string | null = null;
  private baseUrl: string = '/api/v1';

  constructor() {
    // Initial token recovery from storage (discard legacy non-JWT tokens)
    try {
      const saved = localStorage.getItem('cyberpool_auth_token');
      if (saved && saved.includes('.')) {
        this.token = saved;
      } else {
        this.token = null;
        localStorage.removeItem('cyberpool_auth_token');
      }
    } catch {
      this.token = null;
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('cyberpool_auth_token', token);
      } else {
        localStorage.removeItem('cyberpool_auth_token');
      }
    } catch {}
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const json = await res.json();
      if (!res.ok || json.success === false) {
        return {
          success: false,
          error: json.error || `HTTP Error ${res.status}: ${res.statusText}`,
          code: json.code || `HTTP_${res.status}`,
          requestId
        };
      }

      return {
        success: true,
        data: json,
        requestId
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Request timeout after 15s', code: 'TIMEOUT', requestId };
      }
      return { success: false, error: err?.message || 'Network communication failure', code: 'NETWORK_ERROR', requestId };
    }
  }

  public async get<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public async post<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers
    });
  }

  public async put<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers
    });
  }

  public async patch<T = any>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers
    });
  }

  public async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const api = new ApiService();
