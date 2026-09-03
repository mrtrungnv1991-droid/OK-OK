// ==============================================================================
// CYBERPOOL: BASE SOURCE CONNECTOR ABSTRACT SPECIFICATION
// ==============================================================================
import { 
  SourceAccount, 
  ConnectorExecutionResult, 
  RawScannedProduct, 
  ScannerProfileConfig 
} from '../types';

export abstract class BaseSourceConnector {
  protected account: SourceAccount;
  protected profileConfig: ScannerProfileConfig;

  constructor(account: SourceAccount, profileConfig: ScannerProfileConfig) {
    this.account = account;
    this.profileConfig = profileConfig;
  }

  /**
   * Ping / verify accessibility to the source domain
   */
  abstract test_connection(): Promise<ConnectorExecutionResult<boolean>>;

  /**
   * Authenticate using browser profile, cookies or credentials
   */
  abstract login(): Promise<ConnectorExecutionResult<{ 
    sessionValid: boolean; 
    balance?: number; 
    currency?: string 
  }>>;

  /**
   * Discover and retrieve list of categories visible to the account
   */
  abstract get_categories(): Promise<ConnectorExecutionResult<Array<{ 
    id: string; 
    name: string; 
    url?: string 
  }>>>;

  /**
   * Scan product listings for a category with pagination support
   */
  abstract scan_products(
    category?: { id: string; name: string; url?: string },
    onProductFound?: (product: RawScannedProduct) => void
  ): Promise<ConnectorExecutionResult<RawScannedProduct[]>>;

  /**
   * Read detailed product information from its individual product page
   */
  abstract get_product_detail(source_product_id: string): Promise<ConnectorExecutionResult<RawScannedProduct>>;

  /**
   * Check real-time stock of a single product
   */
  abstract get_product_stock(source_product_id: string): Promise<ConnectorExecutionResult<number>>;

  /**
   * Check real-time price of a single product
   */
  abstract get_product_price(source_product_id: string): Promise<ConnectorExecutionResult<number>>;

  /**
   * Read purchase/order history from source account
   */
  abstract get_order_history(): Promise<ConnectorExecutionResult<any[]>>;

  /**
   * Execute purchase on source website using account balance/credits
   */
  abstract purchase(
    product_id: string, 
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<ConnectorExecutionResult<{ 
    purchaseId: string; 
    status: string; 
    key?: string; 
    balanceRemaining?: number 
  }>>;
}
