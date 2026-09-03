// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - STORAGE & SEED ENGINE
// Conforms strictly to Sections 4, 8, 21, 23, 29, 32, 97 of Payment Specification
// ==============================================================================

import {
  SourceAccount,
  PaymentTransaction,
  PaymentAttempt,
  ProviderCapability,
  PaymentAuditLog,
  ReconciliationItem,
  DeadLetterQueueItem,
  PaymentSystemConfig
} from './types';
import { encryptCredential } from './security';

export class PaymentStore {
  public accounts: Map<string, SourceAccount> = new Map();
  public transactions: Map<string, PaymentTransaction> = new Map();
  public idempotencyIndex: Map<string, string> = new Map(); // idempotency_key -> transaction_id
  public externalRefIndex: Map<string, string> = new Map(); // provider:external_id -> transaction_id
  public attempts: PaymentAttempt[] = [];
  public providers: Map<string, ProviderCapability> = new Map();
  public auditLogs: PaymentAuditLog[] = [];
  public reconciliationItems: ReconciliationItem[] = [];
  public dlq: Map<string, DeadLetterQueueItem> = new Map();
  public webhookEvents: Map<string, { receivedAt: string; payloadHash: string }> = new Map();

  public systemConfig: PaymentSystemConfig = {
    payment_live_mode: false, // Section 97: Default is false (Sandbox / Mock mode)
    default_max_attempts: 5,
    payment_lock_ttl_seconds: 60,
    balance_check_interval_seconds: 300,
    reconciliation_interval_seconds: 900,
    default_currency: 'VND',
    maintenance_mode: false
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Providers
    const providersList: ProviderCapability[] = [
      {
        provider_id: 'provider_genshin_api',
        name: 'HoYoverse Direct Top-up Partner API',
        adapter_type: 'API',
        api_support: true,
        browser_support: false,
        webhook_support: true,
        balance_support: true,
        status_query_support: true,
        refund_support: false,
        currency_support: ['VND', 'USD'],
        max_concurrency: 5,
        rate_limit_per_minute: 60,
        health: 'UP',
        success_rate: 99.4,
        average_latency_ms: 220,
        circuit_breaker: {
          state: 'CLOSED',
          consecutive_failures: 0,
          failure_threshold: 5,
          cooldown_seconds: 60
        }
      },
      {
        provider_id: 'provider_riot_browser',
        name: 'Riot Games Gateway (Browser Worker Adapter)',
        adapter_type: 'BROWSER',
        api_support: false,
        browser_support: true,
        webhook_support: false,
        balance_support: true,
        status_query_support: true,
        refund_support: false,
        currency_support: ['VND', 'USD'],
        max_concurrency: 2,
        rate_limit_per_minute: 20,
        health: 'UP',
        success_rate: 97.8,
        average_latency_ms: 1150,
        circuit_breaker: {
          state: 'CLOSED',
          consecutive_failures: 0,
          failure_threshold: 5,
          cooldown_seconds: 60
        }
      },
      {
        provider_id: 'provider_steam_wallet',
        name: 'Steam Global Topup API',
        adapter_type: 'API',
        api_support: true,
        browser_support: false,
        webhook_support: true,
        balance_support: true,
        status_query_support: true,
        refund_support: true,
        currency_support: ['USD', 'VND', 'EUR'],
        max_concurrency: 4,
        rate_limit_per_minute: 45,
        health: 'UP',
        success_rate: 98.9,
        average_latency_ms: 380,
        circuit_breaker: {
          state: 'CLOSED',
          consecutive_failures: 0,
          failure_threshold: 5,
          cooldown_seconds: 60
        }
      },
      {
        provider_id: 'mock_game_topup_v1',
        name: 'Universal Sandbox Mock Provider (Test Bench)',
        adapter_type: 'MOCK',
        api_support: true,
        browser_support: true,
        webhook_support: true,
        balance_support: true,
        status_query_support: true,
        refund_support: true,
        currency_support: ['VND', 'USD', 'EUR', 'SGD', 'USDT'],
        max_concurrency: 10,
        rate_limit_per_minute: 200,
        health: 'UP',
        success_rate: 100,
        average_latency_ms: 80,
        circuit_breaker: {
          state: 'CLOSED',
          consecutive_failures: 0,
          failure_threshold: 5,
          cooldown_seconds: 30
        }
      }
    ];

    providersList.forEach(p => this.providers.set(p.provider_id, p));

    // 2. Source Accounts
    const accountsList: SourceAccount[] = [
      {
        id: 'acc_genshin_alpha',
        provider_id: 'provider_genshin_api',
        external_account_id: 'HOYO_MASTER_VN_01',
        username: 'hoyo_distributor_alpha',
        display_name: 'HoYoverse Wholesale Account #1 (Alpha)',
        currency: 'VND',
        status: 'ACTIVE',
        balance: 45000000,           // 45,000,000 VND
        available_balance: 45000000,
        reserved_balance: 0,
        daily_limit: 100000000,      // 100M VND
        transaction_limit: 20000000, // 20M VND
        used_today: 14500000,
        last_balance_check: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        last_successful_transaction: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        error_count: 0,
        concurrency_limit: 2,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('api_key_live_hoyo_alpha_sec99824'),
        auth_type: 'API_KEY',
        created_at: '2026-01-10T08:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'acc_genshin_beta',
        provider_id: 'provider_genshin_api',
        external_account_id: 'HOYO_MASTER_VN_02',
        username: 'hoyo_distributor_beta',
        display_name: 'HoYoverse Wholesale Account #2 (Beta Backup)',
        currency: 'VND',
        status: 'ACTIVE',
        balance: 28000000,
        available_balance: 28000000,
        reserved_balance: 0,
        daily_limit: 50000000,
        transaction_limit: 10000000,
        used_today: 6200000,
        last_balance_check: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        last_successful_transaction: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        error_count: 0,
        concurrency_limit: 1,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('api_key_live_hoyo_beta_sec77211'),
        auth_type: 'API_KEY',
        created_at: '2026-01-15T08:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'acc_riot_web01',
        provider_id: 'provider_riot_browser',
        external_account_id: 'RIOT_WEB_OPERATOR_01',
        username: 'riot_sea_dist_01',
        display_name: 'Riot Games Browser Worker Account',
        currency: 'VND',
        status: 'ACTIVE',
        balance: 18500000,
        available_balance: 18500000,
        reserved_balance: 0,
        daily_limit: 40000000,
        transaction_limit: 5000000,
        used_today: 8900000,
        last_balance_check: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        last_successful_transaction: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        error_count: 1,
        concurrency_limit: 1,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('session_cookie_v2_isolated_riot_token'),
        auth_type: 'PASSWORD_SESSION',
        created_at: '2026-02-01T09:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'acc_steam_usd',
        provider_id: 'provider_steam_wallet',
        external_account_id: 'STEAM_PARTNER_CORP_01',
        username: 'steam_partner_corp',
        display_name: 'Steam Partner Wallet (USD Pool)',
        currency: 'USD',
        status: 'ACTIVE',
        balance: 385000, // 3,850.00 USD (in cents)
        available_balance: 385000,
        reserved_balance: 0,
        daily_limit: 1000000, // 10,000 USD
        transaction_limit: 200000,
        used_today: 145000,
        last_balance_check: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        last_successful_transaction: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        error_count: 0,
        concurrency_limit: 2,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('steam_web_api_token_k994103'),
        auth_type: 'BEARER_TOKEN',
        created_at: '2026-02-10T10:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'acc_mock_sandbox',
        provider_id: 'mock_game_topup_v1',
        external_account_id: 'SANDBOX_MASTER_POOL',
        username: 'sandbox_tester',
        display_name: 'Universal Sandbox Master Account',
        currency: 'VND',
        status: 'ACTIVE',
        balance: 100000000, // 100M VND
        available_balance: 100000000,
        reserved_balance: 0,
        daily_limit: 500000000,
        transaction_limit: 50000000,
        used_today: 0,
        last_balance_check: new Date().toISOString(),
        last_successful_transaction: new Date().toISOString(),
        error_count: 0,
        concurrency_limit: 5,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('sandbox_key_infinite_balance'),
        auth_type: 'API_KEY',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      },
      {
        id: 'acc_low_balance_sample',
        provider_id: 'provider_genshin_api',
        external_account_id: 'HOYO_DEPLETED_03',
        username: 'hoyo_depleted_sub',
        display_name: 'HoYoverse Reserve Pool #3 (Depleted)',
        currency: 'VND',
        status: 'LOW_BALANCE',
        balance: 150000, // 150k VND (deficient)
        available_balance: 150000,
        reserved_balance: 0,
        daily_limit: 20000000,
        transaction_limit: 5000000,
        used_today: 19850000,
        last_balance_check: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        error_count: 0,
        concurrency_limit: 1,
        current_concurrent_jobs: 0,
        encrypted_credential: encryptCredential('sec_token_depleted_pool'),
        auth_type: 'API_KEY',
        created_at: '2026-02-15T00:00:00Z',
        updated_at: new Date().toISOString()
      }
    ];

    accountsList.forEach(acc => this.accounts.set(acc.id, acc));

    // 3. Seed Transactions
    const seedTx: PaymentTransaction[] = [
      {
        id: 'pay_hoyovn_1001',
        idempotency_key: 'ORD_1001_TOPUP_001',
        order_id: 'ORD_1001',
        user_id: 'usr_buyer_01',
        provider_id: 'provider_genshin_api',
        source_account_id: 'acc_genshin_alpha',
        amount: 500000,
        currency: 'VND',
        fee: 5000,
        net_amount: 495000,
        recipient: 'UID_882910414',
        status: 'SUCCESS',
        external_transaction_id: 'EXT-HOYO-LIVE-889104',
        external_reference: 'REF_99104',
        request_payload_hash: 'hash_991823901',
        attempt_count: 1,
        max_attempts: 5,
        trace_id: 'trace_seeded_01',
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 2 * 3600 * 1000 + 4000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 3600 * 1000 + 4000).toISOString()
      },
      {
        id: 'pay_hoyovn_1002',
        idempotency_key: 'ORD_1002_TOPUP_001',
        order_id: 'ORD_1002',
        user_id: 'usr_buyer_02',
        provider_id: 'provider_genshin_api',
        source_account_id: 'acc_genshin_alpha',
        amount: 1000000,
        currency: 'VND',
        fee: 10000,
        net_amount: 990000,
        recipient: 'UID_771920311',
        status: 'SUCCESS',
        external_transaction_id: 'EXT-HOYO-LIVE-889105',
        external_reference: 'REF_99105',
        request_payload_hash: 'hash_991823902',
        attempt_count: 1,
        max_attempts: 5,
        trace_id: 'trace_seeded_02',
        created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 3600 * 1000 + 3500).toISOString(),
        updated_at: new Date(Date.now() - 1 * 3600 * 1000 + 3500).toISOString()
      },
      {
        id: 'pay_steam_2001',
        idempotency_key: 'ORD_STEAM_2001_TOPUP',
        order_id: 'ORD_STEAM_2001',
        user_id: 'usr_buyer_03',
        provider_id: 'provider_steam_wallet',
        source_account_id: 'acc_steam_usd',
        amount: 2500, // 25.00 USD
        currency: 'USD',
        fee: 50,
        net_amount: 2450,
        recipient: 'STEAM_ID_76561198000000001',
        status: 'SUCCESS',
        external_transaction_id: 'EXT-STEAM-WAL-55102',
        external_reference: 'REF_STEAM_55102',
        request_payload_hash: 'hash_steam_2001',
        attempt_count: 1,
        max_attempts: 5,
        trace_id: 'trace_seeded_03',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 30 * 60 * 1000 + 2000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000 + 2000).toISOString()
      },
      {
        id: 'pay_review_sample',
        idempotency_key: 'ORD_TIMEOUT_SAMPLE_001',
        order_id: 'ORD_TIMEOUT_SAMPLE',
        user_id: 'usr_buyer_04',
        provider_id: 'provider_riot_browser',
        source_account_id: 'acc_riot_web01',
        amount: 200000,
        currency: 'VND',
        fee: 2000,
        net_amount: 198000,
        recipient: 'RIOT_ID_PHANTOM#VN2',
        status: 'MANUAL_REVIEW',
        last_error_code: 'PROVIDER_TIMEOUT_UNCONFIRMED',
        last_error_message: 'External request timed out during browser form submission. Manual receipt verification required.',
        request_payload_hash: 'hash_timeout_sample',
        attempt_count: 5,
        max_attempts: 5,
        trace_id: 'trace_review_01',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ];

    seedTx.forEach(tx => {
      this.transactions.set(tx.id, tx);
      this.idempotencyIndex.set(tx.idempotency_key, tx.id);
      if (tx.external_transaction_id) {
        this.externalRefIndex.set(`${tx.provider_id}:${tx.external_transaction_id}`, tx.id);
      }
    });

    // 4. Audit Log seed
    this.auditLogs.push(
      {
        id: 'aud_seed_01',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        who: 'System / PaymentGateway',
        what: 'PAYMENT_SETTLED',
        resource: 'PAYMENT',
        resource_id: 'pay_hoyovn_1001',
        after: { status: 'SUCCESS', amount: 500000, recipient: 'UID_882910414' },
        ip: '127.0.0.1',
        trace_id: 'trace_seeded_01',
        notes: 'Idempotency validated, verified balance reserved and settled without mismatch'
      },
      {
        id: 'aud_seed_02',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        who: 'PaymentWorker-1',
        what: 'ESCALATED_TO_MANUAL_REVIEW',
        resource: 'PAYMENT',
        resource_id: 'pay_review_sample',
        after: { status: 'MANUAL_REVIEW', reason: 'PROVIDER_TIMEOUT_UNCONFIRMED' },
        ip: '10.0.0.4',
        trace_id: 'trace_review_01',
        notes: 'Max retries exceeded with indeterminate external status. DLQ flagged.'
      }
    );

    // 5. Seed DLQ item
    this.dlq.set('dlq_01', {
      id: 'dlq_01',
      payment_id: 'pay_review_sample',
      reason: 'Max attempts (5) reached with indeterminate external status',
      failed_attempts: 5,
      last_error_code: 'PROVIDER_TIMEOUT_UNCONFIRMED',
      last_error_message: 'Request timed out on browser worker session',
      queued_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
    });
  }

  // Audit helper
  public logAudit(log: Omit<PaymentAuditLog, 'id' | 'timestamp'>) {
    const entry: PaymentAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.auditLogs.unshift(entry);
    // Keep max 500 audit logs
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
}

export const paymentStore = new PaymentStore();
