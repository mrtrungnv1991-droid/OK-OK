// ==============================================================================
// CYBERPOOL: CIRCUIT BREAKER FOR EXTERNAL SOURCE PROVIDERS
// ==============================================================================

import { CircuitBreakerStatus } from './types';

export class SourceCircuitBreaker {
  private breakers: Map<string, {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failure_count: number;
    success_count: number;
    threshold: number;
    cooldown_ms: number;
    last_failure_at?: number;
    opened_at?: number;
  }> = new Map();

  constructor() {
    // Default configs for known providers
    this.initProvider('Muakey.com', 5, 30000);
    this.initProvider('DivineShop.vn', 5, 30000);
    this.initProvider('TapHoaMMO.net', 5, 30000);
  }

  public initProvider(provider: string, threshold: number = 5, cooldownMs: number = 30000) {
    if (!this.breakers.has(provider)) {
      this.breakers.set(provider, {
        state: 'CLOSED',
        failure_count: 0,
        success_count: 0,
        threshold,
        cooldown_ms: cooldownMs
      });
    }
  }

  /**
   * Check if a request to the provider is permitted
   */
  public canExecute(provider: string): { allowed: boolean; state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; reason?: string } {
    this.initProvider(provider);
    const b = this.breakers.get(provider)!;
    const now = Date.now();

    if (b.state === 'CLOSED') {
      return { allowed: true, state: 'CLOSED' };
    }

    if (b.state === 'OPEN') {
      // Check if cooldown expired to transition to HALF_OPEN
      if (b.opened_at && now - b.opened_at >= b.cooldown_ms) {
        b.state = 'HALF_OPEN';
        b.success_count = 0;
        return {
          allowed: true,
          state: 'HALF_OPEN',
          reason: `Circuit Breaker chuyển sang HALF_OPEN để gửi yêu cầu thăm dò tới ${provider}`
        };
      }

      const remainingSec = Math.ceil((b.cooldown_ms - (now - (b.opened_at || now))) / 1000);
      return {
        allowed: false,
        state: 'OPEN',
        reason: `Circuit Breaker đang MỞ (OPEN) do ${b.failure_count} lỗi liên tiếp từ ${provider}. Vui lòng thử lại sau ${remainingSec}s.`
      };
    }

    // In HALF_OPEN, allow limited probe requests
    return { allowed: true, state: 'HALF_OPEN' };
  }

  /**
   * Records a successful request
   */
  public recordSuccess(provider: string) {
    this.initProvider(provider);
    const b = this.breakers.get(provider)!;

    if (b.state === 'HALF_OPEN') {
      b.success_count += 1;
      // If probe request succeeds, close the circuit
      if (b.success_count >= 2) {
        b.state = 'CLOSED';
        b.failure_count = 0;
        b.opened_at = undefined;
      }
    } else if (b.state === 'CLOSED') {
      b.failure_count = 0;
    }
  }

  /**
   * Records a failure (timeout, network error, 5xx)
   */
  public recordFailure(provider: string): { tripped: boolean; newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' } {
    this.initProvider(provider);
    const b = this.breakers.get(provider)!;
    const now = Date.now();

    b.failure_count += 1;
    b.last_failure_at = now;

    if (b.state === 'HALF_OPEN' || b.failure_count >= b.threshold) {
      b.state = 'OPEN';
      b.opened_at = now;
      return { tripped: true, newState: 'OPEN' };
    }

    return { tripped: false, newState: b.state };
  }

  /**
   * Manual reset by Admin
   */
  public reset(provider: string) {
    this.initProvider(provider);
    const b = this.breakers.get(provider)!;
    b.state = 'CLOSED';
    b.failure_count = 0;
    b.success_count = 0;
    b.opened_at = undefined;
  }

  /**
   * Trip breaker intentionally (for testing / outage handling)
   */
  public trip(provider: string) {
    this.initProvider(provider);
    const b = this.breakers.get(provider)!;
    b.state = 'OPEN';
    b.failure_count = b.threshold;
    b.opened_at = Date.now();
  }

  /**
   * Get statuses for all providers
   */
  public getAllStatuses(): CircuitBreakerStatus[] {
    const list: CircuitBreakerStatus[] = [];
    const now = Date.now();

    this.breakers.forEach((b, provider) => {
      let nextAllowed: string | undefined = undefined;
      if (b.state === 'OPEN' && b.opened_at) {
        nextAllowed = new Date(b.opened_at + b.cooldown_ms).toISOString();
      }

      list.push({
        provider,
        state: b.state,
        failure_count: b.failure_count,
        success_count: b.success_count,
        threshold: b.threshold,
        cooldown_ms: b.cooldown_ms,
        last_failure_at: b.last_failure_at ? new Date(b.last_failure_at).toISOString() : undefined,
        next_attempt_allowed_at: nextAllowed
      });
    });

    return list;
  }
}

export const sourceCircuitBreaker = new SourceCircuitBreaker();
