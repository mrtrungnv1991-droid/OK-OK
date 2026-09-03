/**
 * CyberPool API Client Layer
 * Handles all requests to /api/v1/* with auth tokens, error wrapping, and type safety
 */

export class ApiClient {
  private static token: string | null = 'usr-buyer-01';

  public static setToken(token: string) {
    this.token = token;
  }

  public static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any)
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
      headers['x-user-id'] = this.token;
    }

    try {
      const res = await fetch(endpoint, {
        ...options,
        headers
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        return { success: false, error: json.error || `HTTP Error ${res.status}` };
      }
      return { success: true, data: json };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network request failed' };
    }
  }

  // Auth
  public static async getProfile() {
    return this.request('/api/v1/auth/me');
  }

  public static async login(email?: string) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Products
  public static async getProducts(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/v1/products${query ? `?${query}` : ''}`);
  }

  // Wallet & Ledger
  public static async getWalletLedger() {
    return this.request('/api/v1/wallet/ledger');
  }

  public static async deposit(amount: number, methodTitle: string) {
    return this.request('/api/v1/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, methodTitle })
    });
  }

  public static async submitTelcoCard(data: { telco: string; declaredAmount: number; pin: string; serial: string }) {
    return this.request('/api/v1/wallet/telco-card', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Orders
  public static async getOrders() {
    return this.request('/api/v1/orders');
  }

  public static async instantBuy(productId: string) {
    return this.request('/api/v1/orders/instant-buy', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
  }

  public static async gameTopup(data: { gameId: string; tierId: string; uid: string; zoneId?: string; server?: string; characterName?: string }) {
    return this.request('/api/v1/orders/topup-game', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Escrow
  public static async getEscrowPools() {
    return this.request('/api/v1/escrow/pools');
  }

  public static async joinEscrowPool(poolId: string, productId: string) {
    return this.request('/api/v1/escrow/join', {
      method: 'POST',
      body: JSON.stringify({ poolId, productId })
    });
  }

  // Reviews
  public static async submitReview(data: { productId: string; rating: number; comment: string; orderId?: string }) {
    return this.request('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Admin Telemetry & Dashboard
  public static async getAdminDashboard() {
    return this.request('/api/v1/admin/dashboard');
  }

  public static async getAuditLogs() {
    return this.request('/api/v1/admin/audit-logs');
  }
}
