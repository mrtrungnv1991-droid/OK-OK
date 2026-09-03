// ==============================================================================
// CYBERPOOL: RELIABLE ORDER PROCESSING & DELIVERY TYPES
// ==============================================================================

export type ReliableOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'SOURCE_BALANCE_CHECKING'
  | 'WAITING_SOURCE_BALANCE'
  | 'PURCHASE_PENDING'
  | 'PURCHASE_UNKNOWN'
  | 'PURCHASE_RECONCILING'
  | 'PURCHASE_FAILED'
  | 'PURCHASE_CONFIRMED'
  | 'KEY_SECURED'
  | 'DELIVERY_PENDING'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'MANUAL_REVIEW'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ReliableOrder {
  id: string; // e.g. "CP-88219"
  order_hash: string; // e.g. "CP-MKY-88219"
  customer_id: string;
  customer_name: string;
  customer_email: string;
  product_id: string;
  product_title: string;
  product_type: 'KEY' | 'ACCOUNT' | 'DIRECT_TOPUP';
  quantity: number;
  retail_price: number;
  source_estimated_cost: number;
  currency: string;
  source_provider: string; // e.g. "Muakey.com", "DivineShop.vn"
  source_account_id: string; // Account used to buy
  status: ReliableOrderStatus;
  version: number; // Optimistic locking
  attempt_count: number;
  reconciliation_count: number;
  max_reconciliation_attempts: number;
  escrow_locked: boolean;
  source_transaction_id?: string;
  delivery_channels: ('WEB_ACCOUNT' | 'EMAIL' | 'TELEGRAM' | 'IN_APP')[];
  failure_reason?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PurchaseAttempt {
  attempt_id: string; // e.g. "A-10001"
  order_id: string;
  provider: string;
  status: 'PENDING' | 'SUCCESS' | 'TIMEOUT' | 'NETWORK_ERROR' | 'FAILED' | 'RECONCILED';
  request_payload: Record<string, any>;
  response_payload?: Record<string, any>;
  source_transaction_id?: string;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
}

export interface SourceTransaction {
  id: string; // e.g. "MK-5518291"
  order_id: string;
  order_hash: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  product_name: string;
  account_identity: string;
  created_at: string;
  raw_data?: Record<string, any>;
}

export interface KeyVaultRecord {
  id: string; // e.g. "KV-99012"
  order_id: string;
  customer_id: string;
  provider: string;
  source_transaction_id: string;
  product_id: string;
  encrypted_key: string; // AES-256-CBC ciphertext
  key_hash: string; // SHA-256 checksum for integrity
  status: 'SECURED' | 'DELIVERED' | 'REVOKED';
  delivery_attempts: number;
  created_at: string;
  delivered_at?: string;
}

export interface DeliveryRecord {
  delivery_id: string; // e.g. "DEL-1001"
  order_id: string;
  channel: 'WEB_ACCOUNT' | 'EMAIL' | 'TELEGRAM' | 'IN_APP';
  attempt: number;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'FAILED';
  recipient: string;
  last_error?: string;
  created_at: string;
  sent_at?: string;
}

export interface NotificationRecord {
  id: string; // e.g. "NOTIF-01"
  order_id: string;
  channel: 'TELEGRAM' | 'EMAIL' | 'WEB_ADMIN' | 'ZALO_ZNS';
  payload: {
    chat_id?: string;
    text: string;
    parse_mode?: string;
    inline_keyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
    recipient?: string;
  };
  attempt: number;
  max_retries: number;
  status: 'QUEUED' | 'SENDING' | 'ACKNOWLEDGED' | 'RETRYING' | 'DLQ';
  next_retry_at?: string;
  last_error?: string;
  telegram_http_status?: number;
  is_dlq: boolean;
  created_at: string;
  sent_at?: string;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  event_type:
    | 'ORDER_CREATED'
    | 'PAYMENT_LOCKED'
    | 'BALANCE_CHECKED'
    | 'WAITING_BALANCE'
    | 'BALANCE_CONFIRMED'
    | 'PURCHASE_STARTED'
    | 'PURCHASE_TIMEOUT'
    | 'PURCHASE_UNKNOWN_FLAGGED'
    | 'RECONCILIATION_STARTED'
    | 'SOURCE_PURCHASE_CONFIRMED'
    | 'KEY_SECURED'
    | 'DELIVERY_DISPATCHED'
    | 'DELIVERY_DELIVERED'
    | 'COMPLETED'
    | 'ESCALATED_MANUAL_REVIEW'
    | 'MANUAL_OVERRIDE'
    | 'REFUND_ISSUED'
    | 'CIRCUIT_BREAKER_TRIGGERED';
  actor_type: 'SYSTEM' | 'WORKER' | 'ADMIN' | 'RECONCILER' | 'CUSTOMER';
  actor_id: string;
  metadata: Record<string, any>;
  correlation_id: string;
  created_at: string;
}

export interface TelegramActionPayload {
  order_id: string;
  action: 'CONFIRM_FUNDS' | 'RETRY_RECONCILE' | 'VIEW_ORDER' | 'REFUND';
  nonce: string;
  operator_id: string;
  timestamp: number;
  signature?: string;
}

export interface DualStreamMessage {
  id: string;
  order_id: string;
  stream: 'CUSTOMER' | 'PROVIDER';
  sender: 'CUSTOMER' | 'ADMIN' | 'PROVIDER_SUPPORT';
  sender_name: string;
  content: string;
  redacted_content?: string;
  contains_sensitive_data: boolean;
  detected_sensitive_types: string[]; // e.g. ['PASSWORD', 'OTP', '2FA', 'SESSION_TOKEN']
  is_forwarded: boolean;
  created_at: string;
}

export interface CircuitBreakerStatus {
  provider: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failure_count: number;
  success_count: number;
  threshold: number;
  cooldown_ms: number;
  last_failure_at?: string;
  next_attempt_allowed_at?: string;
}

export interface ReliabilityMetrics {
  total_orders: number;
  completed_orders: number;
  unknown_orders_count: number; // Alerts when > 0
  reconciled_orders_count: number;
  duplicate_purchases_prevented: number;
  duplicate_purchase_rate: string; // e.g. "0.00%"
  order_success_rate: string; // e.g. "99.8%"
  reconciliation_success_rate: string;
  delivery_success_rate: string;
  avg_processing_time_ms: number;
  dlq_notifications_count: number;
  manual_review_count: number;
  source_error_rate: string;
}
