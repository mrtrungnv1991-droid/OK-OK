// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM (v1.0.0) - TYPES & MODELS
// Conforms strictly to Payment System Specification (Sections 4, 5, 8, 9, 81)
// ==============================================================================

export type PaymentStatus =
  | 'CREATED'
  | 'VALIDATING'
  | 'QUEUED'
  | 'RESERVED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'RETRY_WAIT'
  | 'FAILED'
  | 'PENDING_EXTERNAL'
  | 'UNKNOWN'
  | 'CANCELLED'
  | 'MANUAL_REVIEW'
  | 'WAITING_FOR_BALANCE';

export type AccountStatus =
  | 'ACTIVE'
  | 'DISABLED'
  | 'PAUSED'
  | 'COOLDOWN'
  | 'LOW_BALANCE'
  | 'ERROR'
  | 'AUTH_REQUIRED'
  | 'MAINTENANCE'
  | 'RISK_REVIEW';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ProviderHealthStatus = 'UP' | 'DEGRADED' | 'DOWN';

export type AccountHealthStatus = 'HEALTHY' | 'WARNING' | 'ERROR';

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'SGD' | 'USDT';

export interface SourceAccount {
  id: string;
  provider_id: string;
  external_account_id: string;
  username: string;
  display_name: string;
  currency: CurrencyCode;
  status: AccountStatus;
  balance: number;            // Verified balance in minor units/integer
  available_balance: number;  // verified_balance - reserved_balance
  reserved_balance: number;   // currently locked for pending operations
  daily_limit: number;        // max allowed volume per day
  transaction_limit: number;  // max allowed volume per single transaction
  used_today: number;
  last_balance_check: string;
  last_successful_transaction?: string;
  last_error_at?: string;
  error_count: number;
  cooldown_until?: string;
  concurrency_limit: number;  // default 1
  current_concurrent_jobs: number;
  encrypted_credential: string; // AES-256 encrypted string, NEVER logged in plaintext
  auth_type: 'API_KEY' | 'PASSWORD_SESSION' | 'BEARER_TOKEN' | 'OAUTH2';
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  idempotency_key: string;
  order_id: string;
  user_id: string;
  provider_id: string;
  source_account_id?: string;
  amount: number;             // minor units / integer (no floats)
  currency: CurrencyCode;
  fee: number;                // fixed fee at creation time
  net_amount: number;         // amount - fee
  recipient: string;          // Target user / character / game account ID
  status: PaymentStatus;
  external_transaction_id?: string;
  external_reference?: string;
  request_payload_hash: string;
  attempt_count: number;
  max_attempts: number;       // default 5
  last_error_code?: string;
  last_error_message?: string;
  trace_id: string;
  reservation_expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  processing_at?: string;
  completed_at?: string;
  failed_at?: string;
  updated_at: string;
}

export interface PaymentAttempt {
  id: string;
  payment_transaction_id: string;
  source_account_id: string;
  attempt_number: number;
  request_id: string;
  external_transaction_id?: string;
  status: 'STARTED' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN';
  request_started_at: string;
  request_finished_at?: string;
  error_code?: string;
  error_message?: string;
  raw_response_redacted?: string; // sensitive tokens redacted
  created_at: string;
}

export interface ProviderCapability {
  provider_id: string;
  name: string;
  adapter_type: 'API' | 'BROWSER' | 'MOCK';
  api_support: boolean;
  browser_support: boolean;
  webhook_support: boolean;
  balance_support: boolean;
  status_query_support: boolean;
  refund_support: boolean;
  currency_support: CurrencyCode[];
  max_concurrency: number;
  rate_limit_per_minute: number;
  health: ProviderHealthStatus;
  success_rate: number;
  average_latency_ms: number;
  circuit_breaker: {
    state: CircuitBreakerState;
    consecutive_failures: number;
    failure_threshold: number; // default 5
    cooldown_seconds: number;   // default 60
    last_failure_at?: string;
    cooldown_until?: string;
  };
}

export interface ProviderTransactionResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING_EXTERNAL' | 'UNKNOWN' | 'RETRYABLE_ERROR';
  external_id?: string;
  amount: number;
  currency: CurrencyCode;
  message?: string;
  raw_reference?: string;
  error_code?: string;
  is_retryable?: boolean;
}

export interface ReconciliationItem {
  id: string;
  timestamp: string;
  type: 'BALANCE_MISMATCH' | 'UNKNOWN_TX' | 'ORPHAN_TX' | 'MISSING_PROVIDER' | 'DUPLICATE_SUSPECTED';
  transaction_id?: string;
  account_id?: string;
  provider_id?: string;
  expected_value: string | number;
  actual_value: string | number;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  notes?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface PaymentAuditLog {
  id: string;
  timestamp: string;
  who: string;
  what: string;
  resource: 'ACCOUNT' | 'PAYMENT' | 'PROVIDER' | 'RECONCILIATION' | 'SYSTEM_CONFIG';
  resource_id: string;
  before?: any;
  after?: any;
  ip: string;
  trace_id: string;
  notes?: string;
}

export interface DeadLetterQueueItem {
  id: string;
  payment_id: string;
  reason: string;
  failed_attempts: number;
  last_error_code?: string;
  last_error_message?: string;
  queued_at: string;
  resolved_at?: string;
  action_taken?: 'MANUAL_SUCCESS' | 'MANUAL_FAIL' | 'FORCE_RETRY' | 'DISMISS';
  resolved_by?: string;
}

export interface PaymentSystemConfig {
  payment_live_mode: boolean;     // False by default (Section 97 Production Safety Switch)
  default_max_attempts: number;   // 5
  payment_lock_ttl_seconds: number; // 60s
  balance_check_interval_seconds: number; // 300s
  reconciliation_interval_seconds: number; // 900s
  default_currency: CurrencyCode;
  maintenance_mode: boolean;
}
