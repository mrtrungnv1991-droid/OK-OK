// ==============================================================================
// CYBERPOOL: SUPPLIER & SOURCE INTEGRATION TYPES
// Unified First-Class Citizens: ACCOUNT, API, CUSTOM
// ==============================================================================

export type ConnectionType = 'ACCOUNT' | 'API' | 'CUSTOM';

export type ConnectionStatus = 
  | 'CONNECTED'
  | 'DEGRADED'
  | 'AUTH_FAILED'
  | 'EXPIRED'
  | 'INVALID'
  | 'LOCKED'
  | 'ERROR'
  | 'ACTION_REQUIRED'
  | 'DISCONNECTED';

export type SupplierStatus = 
  | 'ACTIVE'
  | 'DISABLED'
  | 'ERROR'
  | 'AUTH_REQUIRED'
  | 'INSUFFICIENT_BALANCE'
  | 'OFFLINE';

export type SyncMode = 'FULL' | 'INCREMENTAL' | 'PRICE_ONLY' | 'STOCK_ONLY';

export type MarkupType = 'PERCENT' | 'FIXED';

export type RoundingMode = 'OFF' | 'ROUND_NEAREST' | 'ROUND_UP' | 'ROUND_DOWN';

export type PriceRoundingUnit = 0 | 100 | 500 | 1000 | 5000 | 10000;

export type SupplierErrorCode =
  | 'AUTH_FAILED'
  | 'SESSION_EXPIRED'
  | 'INSUFFICIENT_BALANCE'
  | 'PRODUCT_NOT_FOUND'
  | 'OUT_OF_STOCK'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SUPPLIER_ERROR'
  | 'UNKNOWN'
  | 'ACTION_REQUIRED';

export interface ConnectionCapabilities {
  balance: boolean;
  product_sync: boolean;
  category_sync: boolean;
  create_order: boolean;
  order_status: boolean;
  cancel_order: boolean;
}

export interface SupplierCredentials {
  // Account Connection fields
  username?: string;
  passwordEncrypted?: string;
  sessionEncrypted?: string;
  cookieHeaderEncrypted?: string;
  
  // API Connection fields
  apiKeyEncrypted?: string;
  apiSecretEncrypted?: string;
  tokenEncrypted?: string;

  // Custom configuration
  customConfig?: Record<string, any>;
}

export interface PriceConfig {
  markupType: MarkupType;
  markupValue: number; // e.g. 15 for 15% or 10000 for 10,000 VND
  autoUpdatePrice: boolean;
  manualPriceOverride: boolean;
  roundingUnit: PriceRoundingUnit;
  roundingMode: RoundingMode;
}

export interface SupplierModel {
  id: string;
  name: string;
  websiteUrl: string;
  connectionType: ConnectionType;
  providerType: string; // e.g. 'WEBSITE_ACCOUNT_DEFAULT', 'SHOPCLONE7_API', 'CUSTOM_CONNECTOR'
  status: SupplierStatus;
  connectionStatus: ConnectionStatus;
  balance: number;
  currency: string;
  capabilities: ConnectionCapabilities;
  priceConfig: PriceConfig;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastConnectedAt?: string;
  lastSyncAt?: string;
  lastBalanceCheckAt?: string;
  lastSuccessfulOrderAt?: string;
  lastError?: string;
  actionRequiredMessage?: string;
  lastDiagnostics?: {
    network: 'PASS' | 'FAIL';
    authentication: 'PASS' | 'FAIL' | 'SKIPPED';
    account: 'PASS' | 'FAIL' | 'SKIPPED';
    session: 'PASS' | 'FAIL' | 'SKIPPED';
    balance: 'PASS' | 'FAIL' | 'NOT_SUPPORTED';
    categories: 'PASS' | 'FAIL';
    products: 'PASS' | 'FAIL';
    overallStatus: ConnectionStatus;
    reason?: string;
    checkedAt: string;
    steps?: Array<{ step: string; status: string; message: string; durationMs?: number }>;
  };
  customAdapterConfig?: any;
  stats: {
    totalProducts: number;
    mappedProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedCategory {
  id: string;
  name: string;
  parentId?: string;
  rawCategory?: any;
}

export type DeliveryBranch = 'ACCOUNT' | 'KEY' | 'LINK' | 'GIFTCARD';

export interface NormalizedProduct {
  sourceProductId: string;
  title: string;
  description: string;
  category: string;
  originalPrice: number;
  originalCurrency: string;
  stockAvailable: number;
  images: string[];
  status: 'AVAILABLE' | 'OUT_OF_STOCK' | 'DISABLED' | 'DELETED';
  deliveryBranch?: DeliveryBranch;
  outputFormat?: string;
  metadata?: Record<string, any>;
}

export interface ProductMappingModel {
  id: string;
  supplierId: string;
  supplierProductId: string;
  localProductId: string;
  supplierCategoryId?: string;
  localCategoryId?: string;
  supplierPrice: number;
  calculatedPrice: number;
  manualPrice?: number;
  manualPriceOverride: boolean;
  finalSellingPrice: number;
  status: 'ACTIVE' | 'DISABLED' | 'OUT_OF_STOCK';
  deliveryBranch?: DeliveryBranch;
  outputFormat?: string;
  outputTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMappingModel {
  id: string;
  supplierId: string;
  supplierCategoryId: string;
  supplierCategoryName: string;
  localCategoryId: string;
  mode: 'AUTO' | 'MANUAL' | 'IGNORE';
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderRequest {
  idempotencyKey: string;
  localOrderId: string;
  supplierProductId: string;
  quantity: number;
  customerIdentifier?: string;
  targetAccountUsername?: string;
}

export interface SupplierOrderResult {
  success: boolean;
  supplierOrderReference?: string;
  status: 'COMPLETED' | 'PENDING' | 'SUBMITTED' | 'FAILED' | 'UNKNOWN' | 'ACTION_REQUIRED';
  deliveredKey?: string;
  deliveredCredentials?: {
    username?: string;
    password?: string;
    extra?: string;
  };
  supplierCost: number;
  supplierBalanceAfter?: number;
  errorCode?: SupplierErrorCode;
  errorMessage?: string;
}

export interface SupplierOrderSnapshot {
  id: string;
  localOrderId: string;
  supplierId: string;
  supplierName: string;
  connectionType: ConnectionType;
  supplierProductId: string;
  supplierOrderReference: string;
  customerPrice: number;
  supplierCost: number;
  markupAmount: number;
  platformFees: number;
  netProfit: number;
  currency: string;
  status: 'COMPLETED' | 'SUBMITTED' | 'UNKNOWN' | 'FAILED' | 'RECONCILED';
  deliveredData?: any;
  idempotencyKey: string;
  createdAt: string;
  completedAt?: string;
}

export interface SyncJobModel {
  id: string;
  supplierId: string;
  mode: SyncMode;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  totalDiscovered: number;
  totalItemsScanned: number;
  totalItemsUpserted: number;
  totalItemsMapped: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  totalFailed: number;
  progressPercent: number;
  categoriesScanned: number;
  totalCategories: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  scanDiagnostics?: Array<{ step: string; status: 'PASS' | 'FAIL' | 'SKIPPED'; message: string }>;
}
