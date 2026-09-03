// ==============================================================================
// CYBERPOOL: SOURCE ACCOUNT CONNECTOR & WEBSITE PRODUCT SCAN ENGINE TYPES
// ==============================================================================

export type ConnectorType = 'BROWSER' | 'API' | 'HYBRID';

export type SourceAccountHealth = 
  | 'ONLINE'
  | 'DEGRADED'
  | 'SESSION_EXPIRED'
  | 'LOGIN_FAILED'
  | 'SOURCE_UNAVAILABLE'
  | 'REAUTH_REQUIRED'
  | 'BLOCKED'
  | 'DISABLED';

export type SourceProductStatus = 
  | 'IN_STOCK'
  | 'OUT_OF_STOCK'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'SOURCE_REMOVED';

export type CategoryMappingMode = 'AUTO' | 'MANUAL' | 'IGNORE';

export type ScanJobType = 'FULL' | 'INCREMENTAL' | 'PRODUCT';

export type ScanJobStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export type PaginationStrategy = 'PAGE' | 'LOAD_MORE' | 'INFINITE_SCROLL' | 'CURSOR';

export type PriceRoundingRule = 100 | 500 | 1000 | 5000 | 10000;

export type SourceErrorCode =
  | 'SOURCE_AUTH_FAILED'
  | 'SESSION_EXPIRED'
  | 'SOURCE_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PAGE_CHANGED'
  | 'SELECTOR_NOT_FOUND'
  | 'DATA_PARSE_FAILED'
  | 'RATE_LIMITED'
  | 'SOURCE_UNAVAILABLE'
  | 'ACTION_REQUIRED'
  | 'UNKNOWN_ERROR';

export interface SourceAccount {
  id: string;
  name: string;
  domain: string;
  username: string;
  encrypted_password?: string;
  encrypted_session?: string;
  browser_profile_id: string;
  connector_type: ConnectorType;
  scanner_profile: string;
  proxy_id?: string;
  status: SourceAccountHealth;
  balance: number;
  currency: string;
  low_balance_threshold: number;
  is_active: boolean;
  concurrency_limit: number;
  request_delay_ms: number;
  last_login_at?: string;
  last_scan_at?: string;
  last_successful_scan_at?: string;
  last_purchase_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RawScannedProduct {
  source_product_id: string;
  source_url: string;
  title: string;
  description?: string;
  category_raw?: string;
  original_price: number;
  original_currency: string;
  stock: number;
  source_status: SourceProductStatus;
  raw_metadata?: Record<string, any>;
}

export interface SourceProduct {
  id: string;
  source_account_id: string;
  source_product_id: string;
  source_url: string;
  title: string;
  description?: string;
  category_raw?: string;
  original_price: number;
  original_currency: string;
  stock: number;
  source_status: SourceProductStatus;
  raw_data?: Record<string, any>;
  is_sync_ignored: boolean;
  missing_scan_count: number;
  price_override?: number;
  markup_percent?: number;
  fixed_markup?: number;
  auto_sync_price: boolean;
  first_seen_at: string;
  last_seen_at: string;
  last_synced_at: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceOffer {
  id: string;
  internal_product_id: string;
  source_account_id: string;
  source_product_id: string;
  source_name: string;
  source_price: number;
  currency: string;
  calculated_final_price: number;
  stock: number;
  priority: number;
  status: 'ACTIVE' | 'INSUFFICIENT_FUNDS' | 'OUT_OF_STOCK' | 'OFFLINE';
  last_verified_at: string;
  created_at: string;
  updated_at: string;
}

export interface SourceCategoryMapping {
  id: string;
  source_account_id: string;
  source_category_id: string;
  source_category_name: string;
  internal_category_id?: string;
  internal_category_name?: string;
  mode: CategoryMappingMode;
  created_at: string;
  updated_at: string;
}

export interface BlockedSourceProduct {
  id: string;
  source_account_id: string;
  source_product_id: string;
  reason: string;
  created_at: string;
}

export interface SourceScanJob {
  id: string;
  source_account_id: string;
  source_account_name?: string;
  scan_type: ScanJobType;
  status: ScanJobStatus;
  progress: number; // 0 to 100
  total_categories: number;
  processed_categories: number;
  total_products: number;
  processed_products: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  current_step?: string;
  correlation_id: string;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
  created_at: string;
}

export interface SourceAuditLog {
  id: string;
  correlation_id?: string;
  source_account_id?: string;
  action: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ScannerProfileConfig {
  profileId: string;
  name: string;
  domainPattern: string;
  loginUrl: string;
  categoryListUrl: string;
  categorySelector: string;
  categoryNameSelector?: string;
  paginationStrategy: PaginationStrategy;
  maxPagesSafetyLimit: number;
  loadMoreSelector?: string;
  nextPageSelector?: string;
  productCardSelector: string;
  productIdExtractor: {
    attribute?: string;
    regex?: string;
    selector?: string;
  };
  titleSelector: string;
  priceSelector: string;
  stockSelector: string;
  statusSelector: string;
  detailUrlSelector?: string;
  fallbackSelectors?: {
    price?: string[];
    stock?: string[];
    title?: string[];
  };
  jsonLdEnabled?: boolean;
  politenessDelayMs: number;
}

export interface PricingRuleConfig {
  fxRate: number;
  markupPercent: number;
  fixedMarkup: number;
  roundingRule: PriceRoundingRule;
  autoSyncPrice: boolean;
}

export interface ConnectorExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: SourceErrorCode;
    message: string;
    retryable: boolean;
    requiresAction?: boolean;
  };
}
