import { 
  ConnectionType, 
  ConnectionCapabilities, 
  SupplierCredentials, 
  NormalizedCategory, 
  NormalizedProduct, 
  SupplierOrderRequest, 
  SupplierOrderResult,
  ConnectionStatus
} from '../types';

export interface DiagnosticStep {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'RUNNING';
  message: string;
  durationMs?: number;
}

export interface ConnectionDiagnostics {
  network: 'PASS' | 'FAIL';
  authentication: 'PASS' | 'FAIL' | 'SKIPPED';
  account: 'PASS' | 'FAIL' | 'SKIPPED';
  session: 'PASS' | 'FAIL' | 'SKIPPED';
  balance: 'PASS' | 'FAIL' | 'NOT_SUPPORTED';
  categories: 'PASS' | 'FAIL';
  products: 'PASS' | 'FAIL';
  overallStatus: ConnectionStatus;
  reason?: string;
  steps: DiagnosticStep[];
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  balance?: number;
  currency?: string;
  actionRequired?: boolean;
  actionMessage?: string;
  sessionExpiry?: string;
  diagnostics?: ConnectionDiagnostics;
}

/**
 * Common abstraction for all Supplier Connectors (Account, API, Custom)
 * The Order Service only ever interacts with this interface.
 */
export interface ISupplierConnector {
  readonly id: string;
  readonly name: string;
  readonly websiteUrl: string;
  readonly connectionType: ConnectionType;
  readonly capabilities: ConnectionCapabilities;

  /**
   * Initializes or refreshes session/connection with credentials
   */
  connect(credentials: SupplierCredentials): Promise<ConnectionTestResult>;

  /**
   * Reads real balance from source wallet/account
   */
  getBalance(): Promise<{ balance: number; currency: string; status: string }>;

  /**
   * Fetches available categories from supplier
   */
  getCategories(): Promise<NormalizedCategory[]>;

  /**
   * Fetches products that this connected account or API key has permissions to view/purchase
   */
  getProducts(): Promise<NormalizedProduct[]>;

  /**
   * Fetches details of a specific source product
   */
  getProduct(sourceProductId: string): Promise<NormalizedProduct | null>;

  /**
   * Executes purchase on supplier website using connected Account or API credentials
   * Must support idempotency!
   */
  createOrder(request: SupplierOrderRequest): Promise<SupplierOrderResult>;

  /**
   * Retrieves status of an existing supplier order reference
   */
  getOrderStatus(supplierOrderRef: string): Promise<{
    status: string;
    deliveredKey?: string;
    completedAt?: string;
  }>;
}
