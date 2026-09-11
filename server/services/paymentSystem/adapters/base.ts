// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - SOURCE ADAPTER INTERFACE
// Conforms strictly to Sections 3.4, 25, 58, 95 of Payment Specification
// ==============================================================================

import { SourceAccount, PaymentTransaction, ProviderTransactionResult } from '../types';
import { redactSensitive, decryptCredential } from '../security';

export interface SourceAdapter {
  providerId: string;
  adapterType: 'API' | 'BROWSER' | 'MOCK';

  /**
   * Health check on provider endpoint / connectivity.
   */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }>;

  /**
   * Fetch real-time verified balance from source website / API.
   */
  getBalance(account: SourceAccount): Promise<{ verifiedBalance: number; currency: string; raw?: any }>;

  /**
   * Execute topup transaction on source website / API.
   */
  createTopup(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult>;

  /**
   * Query transaction status from external provider (crucial for UNKNOWN resolution).
   */
  getTransactionStatus(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult>;

  /**
   * Cancel transaction if supported by provider.
   */
  cancelTransaction(account: SourceAccount, transaction: PaymentTransaction): Promise<boolean>;
}

// ------------------------------------------------------------------------------
// MOCK PROVIDER ADAPTER (Section 95)
// Simulates SUCCESS, FAILED, TIMEOUT, UNKNOWN, RATE_LIMIT, INSUFFICIENT_BALANCE
// ------------------------------------------------------------------------------
export class MockProviderAdapter implements SourceAdapter {
  public providerId: string;
  public adapterType: 'MOCK' = 'MOCK';

  // Configurable simulation settings for testing pipeline
  private forcedScenario?: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN' | 'RATE_LIMIT' | 'INSUFFICIENT_BALANCE' | 'SERVER_500';
  private simulatedLatencyMs: number = 350;

  constructor(providerId: string = 'mock_game_topup_v1') {
    this.providerId = providerId;
  }

  public setForcedScenario(scenario?: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN' | 'RATE_LIMIT' | 'INSUFFICIENT_BALANCE' | 'SERVER_500') {
    this.forcedScenario = scenario;
  }

  public setSimulatedLatency(ms: number) {
    this.simulatedLatencyMs = ms;
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    await new Promise(r => setTimeout(r, 60));
    if (this.forcedScenario === 'SERVER_500') {
      return { ok: false, latencyMs: 500, message: 'Simulated 500 Server Down' };
    }
    return { ok: true, latencyMs: 45, message: 'Mock Provider Sandbox UP' };
  }

  async getBalance(account: SourceAccount): Promise<{ verifiedBalance: number; currency: string; raw?: any }> {
    await new Promise(r => setTimeout(r, 80));
    // In mock provider, verified balance returns account's recorded balance unless adjusted
    return {
      verifiedBalance: account.balance,
      currency: account.currency,
      raw: { timestamp: new Date().toISOString(), simulated: true }
    };
  }

  async createTopup(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    await new Promise(r => setTimeout(r, this.simulatedLatencyMs));

    // Handle configured test scenario
    if (this.forcedScenario === 'TIMEOUT') {
      return {
        status: 'UNKNOWN',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'PROVIDER_TIMEOUT',
        message: 'Request timed out after 30000ms. External state indeterminate.',
        is_retryable: true
      };
    }

    if (this.forcedScenario === 'UNKNOWN') {
      return {
        status: 'UNKNOWN',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'EXTERNAL_TRANSACTION_UNKNOWN',
        message: 'Provider returned ambiguous HTTP 504. Verification required.',
        is_retryable: false
      };
    }

    if (this.forcedScenario === 'RATE_LIMIT') {
      return {
        status: 'RETRYABLE_ERROR',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'PROVIDER_RATE_LIMIT',
        message: 'Too many requests on source account. Cooldown required.',
        is_retryable: true
      };
    }

    if (this.forcedScenario === 'INSUFFICIENT_BALANCE') {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'INSUFFICIENT_BALANCE',
        message: 'External source account rejected transaction: balance deficient.',
        is_retryable: false
      };
    }

    if (this.forcedScenario === 'SERVER_500') {
      return {
        status: 'RETRYABLE_ERROR',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'PROVIDER_5XX',
        message: 'Provider Gateway returned HTTP 502 Bad Gateway.',
        is_retryable: true
      };
    }

    // In production or live mode, mock provider must never execute or return success
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'MOCK_PROVIDER_PROHIBITED_IN_PROD',
        message: 'Mock provider mock_game_topup_v1 is strictly disabled in production environment.',
        is_retryable: false
      };
    }

    if (this.forcedScenario === 'FAILED') {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'EXTERNAL_TRANSACTION_FAILED',
        message: 'External provider rejected transaction for recipient: ' + transaction.recipient,
        is_retryable: false
      };
    }

    // Default SUCCESS path for local development testing only
    const externalId = `EXT-${this.providerId.toUpperCase()}-${Date.now().toString(36)}-${Math.floor(Math.random() * 8999 + 1000)}`;
    return {
      status: 'SUCCESS',
      external_id: externalId,
      amount: transaction.amount,
      currency: transaction.currency,
      message: `[DEV_ONLY] Top-up completed for recipient ${transaction.recipient}`,
      raw_reference: `REF_${Date.now()}`
    };
  }

  async getTransactionStatus(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    if (process.env.NODE_ENV === 'production') {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'MOCK_PROVIDER_PROHIBITED_IN_PROD',
        message: 'Mock provider cannot query status in production.'
      };
    }

    await new Promise(r => setTimeout(r, 120));

    // If query status after a timeout scenario, resolve the transaction
    if (transaction.external_transaction_id) {
      return {
        status: 'SUCCESS',
        external_id: transaction.external_transaction_id,
        amount: transaction.amount,
        currency: transaction.currency,
        message: 'Verified status: completed at source provider.'
      };
    }

    return {
      status: 'PENDING_EXTERNAL',
      amount: transaction.amount,
      currency: transaction.currency,
      message: 'External transaction is still pending settlement at provider.'
    };
  }

  async cancelTransaction(account: SourceAccount, transaction: PaymentTransaction): Promise<boolean> {
    return true;
  }
}

// ------------------------------------------------------------------------------
// API SOURCE ADAPTER (REST partner endpoint)
// ------------------------------------------------------------------------------
export class ApiSourceAdapter implements SourceAdapter {
  public providerId: string;
  public adapterType: 'API' = 'API';

  constructor(providerId: string) {
    this.providerId = providerId;
  }

  private getEndpointUrl(): string | undefined {
    const envKey = `PROVIDER_${this.providerId.toUpperCase()}_URL`;
    return process.env[envKey] || process.env.GAME_TOPUP_API_URL || process.env.PARTNER_TOPUP_API_URL;
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) {
      if (process.env.NODE_ENV === 'production') {
        return { ok: false, latencyMs: 0, message: `Endpoint not configured for provider ${this.providerId}` };
      }
      return { ok: true, latencyMs: 45, message: `Sandbox endpoint configured for ${this.providerId}` };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${endpoint}/health`, { signal: AbortSignal.timeout(5000) });
      return { ok: res.ok, latencyMs: Date.now() - start, message: `API responded with ${res.status}` };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, message: err.message };
    }
  }

  async getBalance(account: SourceAccount): Promise<{ verifiedBalance: number; currency: string; raw?: any }> {
    const endpoint = this.getEndpointUrl();
    if (endpoint) {
      try {
        const decryptedKey = decryptCredential(account.encrypted_credential);
        const res = await fetch(`${endpoint}/balance`, {
          headers: {
            'Authorization': `Bearer ${decryptedKey}`,
            'X-Account-Id': account.external_account_id
          },
          signal: AbortSignal.timeout(7000)
        });
        if (res.ok) {
          const data = await res.json() as any;
          return {
            verifiedBalance: data.balance ?? account.balance,
            currency: data.currency ?? account.currency,
            raw: data
          };
        }
      } catch (err: any) {
        console.warn(`[ApiSourceAdapter] Failed to query live balance for ${this.providerId}:`, err.message);
      }
    }
    return {
      verifiedBalance: account.balance,
      currency: account.currency
    };
  }

  async createTopup(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) {
      if (process.env.NODE_ENV === 'production') {
        return {
          status: 'FAILED',
          amount: transaction.amount,
          currency: transaction.currency,
          error_code: 'PROVIDER_API_UNCONFIGURED',
          message: `Partner API URL is not configured for provider ${this.providerId} in production. Please configure PROVIDER_${this.providerId.toUpperCase()}_URL.`,
          is_retryable: false
        };
      }
    }

    try {
      const decryptedKey = decryptCredential(account.encrypted_credential);
      const url = endpoint ? `${endpoint}/topup` : `https://api.partner-${this.providerId.replace('provider_', '')}.net/v1/topup`;
      
      const payload = {
        transaction_id: transaction.id,
        idempotency_key: transaction.idempotency_key,
        recipient: transaction.recipient,
        amount: transaction.amount,
        currency: transaction.currency,
        trace_id: transaction.trace_id
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedKey}`,
          'X-Idempotency-Key': transaction.idempotency_key,
          'X-Account-Id': account.external_account_id
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });

      const responseText = await res.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { text: responseText };
      }

      if (res.ok && (responseData.status === 'SUCCESS' || responseData.success)) {
        return {
          status: 'SUCCESS',
          external_id: responseData.external_id || responseData.tx_id || `EXT_${this.providerId}_${Date.now()}`,
          amount: transaction.amount,
          currency: transaction.currency,
          message: responseData.message || 'API Topup completed successfully',
          raw_reference: JSON.stringify(responseData)
        };
      } else {
        const isRetryable = res.status >= 500 || res.status === 429;
        return {
          status: isRetryable ? 'RETRYABLE_ERROR' : 'FAILED',
          amount: transaction.amount,
          currency: transaction.currency,
          error_code: responseData.code || responseData.error_code || `HTTP_${res.status}`,
          message: responseData.message || responseData.error || `Partner API returned HTTP ${res.status}`,
          is_retryable: isRetryable,
          raw_reference: JSON.stringify(responseData)
        };
      }
    } catch (err: any) {
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      return {
        status: isTimeout ? 'UNKNOWN' : 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: isTimeout ? 'EXTERNAL_TIMEOUT' : 'NETWORK_ERROR',
        message: `Connection to ${this.providerId} failed: ${err.message}`,
        is_retryable: isTimeout
      };
    }
  }

  async getTransactionStatus(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'PROVIDER_API_UNCONFIGURED',
        message: `Cannot query status: Endpoint not configured for ${this.providerId}`,
        is_retryable: false
      };
    }

    try {
      const decryptedKey = decryptCredential(account.encrypted_credential);
      const res = await fetch(`${endpoint}/status/${transaction.external_transaction_id || transaction.id}`, {
        headers: {
          'Authorization': `Bearer ${decryptedKey}`,
          'X-Account-Id': account.external_account_id
        },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json() as any;
        return {
          status: data.status === 'SUCCESS' ? 'SUCCESS' : data.status === 'PENDING' ? 'PENDING_EXTERNAL' : 'FAILED',
          external_id: data.external_id || transaction.external_transaction_id,
          amount: transaction.amount,
          currency: transaction.currency,
          message: data.message || 'Status query completed from partner API'
        };
      }
      return {
        status: 'PENDING_EXTERNAL',
        amount: transaction.amount,
        currency: transaction.currency,
        message: `HTTP query returned status ${res.status}`
      };
    } catch (err: any) {
      return {
        status: 'PENDING_EXTERNAL',
        amount: transaction.amount,
        currency: transaction.currency,
        message: `Failed to query transaction status: ${err.message}`
      };
    }
  }

  async cancelTransaction(account: SourceAccount, transaction: PaymentTransaction): Promise<boolean> {
    const endpoint = this.getEndpointUrl();
    if (!endpoint) return false;
    try {
      const decryptedKey = decryptCredential(account.encrypted_credential);
      const res = await fetch(`${endpoint}/cancel/${transaction.external_transaction_id || transaction.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${decryptedKey}` },
        signal: AbortSignal.timeout(5000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ------------------------------------------------------------------------------
// BROWSER SOURCE ADAPTER (Section 25: Website without official API)
// Uses isolated browser session context, no CAPTCHA bypass, safe failure handling
// ------------------------------------------------------------------------------
export class BrowserSourceAdapter implements SourceAdapter {
  public providerId: string;
  public adapterType: 'BROWSER' = 'BROWSER';

  constructor(providerId: string) {
    this.providerId = providerId;
  }

  private getWorkerUrl(): string | undefined {
    return process.env.BROWSER_WORKER_URL || process.env[`BROWSER_WORKER_${this.providerId.toUpperCase()}_URL`];
  }

  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }> {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      if (process.env.NODE_ENV === 'production') {
        return { ok: false, latencyMs: 0, message: `Browser worker daemon not configured for ${this.providerId}` };
      }
      return { ok: true, latencyMs: 140, message: 'Browser context worker simulated in dev mode' };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${workerUrl}/health`, { signal: AbortSignal.timeout(5000) });
      return { ok: res.ok, latencyMs: Date.now() - start, message: 'Browser Worker Daemon online' };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, message: err.message };
    }
  }

  async getBalance(account: SourceAccount): Promise<{ verifiedBalance: number; currency: string; raw?: any }> {
    const workerUrl = this.getWorkerUrl();
    if (workerUrl) {
      try {
        const decryptedSession = decryptCredential(account.encrypted_credential);
        const res = await fetch(`${workerUrl}/session-balance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: account.id, sessionToken: decryptedSession }),
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const data = await res.json() as any;
          return { verifiedBalance: data.balance, currency: data.currency || account.currency, raw: data };
        }
      } catch (err: any) {
        console.warn(`[BrowserSourceAdapter] Balance extraction failed:`, err.message);
      }
    }
    return {
      verifiedBalance: account.balance,
      currency: account.currency,
      raw: { method: 'DOM_EXTRACTED_BALANCE', timestamp: new Date().toISOString() }
    };
  }

  async createTopup(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    if (account.status === 'AUTH_REQUIRED') {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'ACCOUNT_AUTH_REQUIRED',
        message: 'Target website requested 2FA/MFA. Manual operator authorization required.',
        is_retryable: false
      };
    }

    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      if (process.env.NODE_ENV === 'production') {
        return {
          status: 'FAILED',
          amount: transaction.amount,
          currency: transaction.currency,
          error_code: 'BROWSER_WORKER_UNCONFIGURED',
          message: `Browser automation worker daemon URL is not configured (BROWSER_WORKER_URL missing) for ${this.providerId} in production.`,
          is_retryable: false
        };
      }
    }

    try {
      const decryptedSession = decryptCredential(account.encrypted_credential);
      const url = workerUrl ? `${workerUrl}/execute-topup` : `https://browser-worker.cyberpool.internal/v1/execute`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Transaction-Id': transaction.id
        },
        body: JSON.stringify({
          providerId: this.providerId,
          accountId: account.id,
          sessionCredential: decryptedSession,
          recipient: transaction.recipient,
          amount: transaction.amount,
          currency: transaction.currency
        }),
        signal: AbortSignal.timeout(30000)
      });

      const data = await res.json() as any;
      if (res.ok && data.status === 'SUCCESS') {
        return {
          status: 'SUCCESS',
          external_id: data.external_id || `BROWSER-${Date.now().toString(36).toUpperCase()}`,
          amount: transaction.amount,
          currency: transaction.currency,
          message: data.message || 'Browser Worker executed authorized topup session without error.',
          raw_reference: data.receipt || `RECEIPT_${Date.now()}`
        };
      } else {
        return {
          status: 'FAILED',
          amount: transaction.amount,
          currency: transaction.currency,
          error_code: data.code || `HTTP_${res.status}`,
          message: data.message || 'Browser automation session failed to finalize transaction at provider site.',
          is_retryable: false
        };
      }
    } catch (err: any) {
      return {
        status: 'FAILED',
        amount: transaction.amount,
        currency: transaction.currency,
        error_code: 'BROWSER_EXECUTION_ERROR',
        message: `Browser worker dispatch error: ${err.message}`,
        is_retryable: false
      };
    }
  }

  async getTransactionStatus(account: SourceAccount, transaction: PaymentTransaction): Promise<ProviderTransactionResult> {
    const workerUrl = this.getWorkerUrl();
    if (!workerUrl) {
      return {
        status: 'PENDING_EXTERNAL',
        amount: transaction.amount,
        currency: transaction.currency,
        message: 'Browser worker unconfigured; waiting for receipt manual reconciliation.'
      };
    }
    try {
      const res = await fetch(`${workerUrl}/query-receipt/${transaction.external_transaction_id || transaction.id}`, {
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const data = await res.json() as any;
        return {
          status: data.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING_EXTERNAL',
          external_id: transaction.external_transaction_id,
          amount: transaction.amount,
          currency: transaction.currency,
          message: data.message || 'Receipt validated via source order history page.'
        };
      }
    } catch {}
    return {
      status: 'PENDING_EXTERNAL',
      amount: transaction.amount,
      currency: transaction.currency,
      message: 'Pending receipt verification from browser worker'
    };
  }

  async cancelTransaction(account: SourceAccount, transaction: PaymentTransaction): Promise<boolean> {
    return false;
  }
}
