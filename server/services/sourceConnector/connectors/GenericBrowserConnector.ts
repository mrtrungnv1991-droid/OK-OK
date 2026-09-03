// ==============================================================================
// CYBERPOOL: GENERIC BROWSER CONNECTOR IMPLEMENTATION
// ==============================================================================
import { BaseSourceConnector } from './BaseSourceConnector';
import { 
  ConnectorExecutionResult, 
  RawScannedProduct, 
  SourceAccount, 
  ScannerProfileConfig 
} from '../types';
import { browserSessionManager } from '../browserSessionManager';

export class GenericBrowserConnector extends BaseSourceConnector {
  constructor(account: SourceAccount, profileConfig: ScannerProfileConfig) {
    super(account, profileConfig);
  }

  public async test_connection(): Promise<ConnectorExecutionResult<boolean>> {
    try {
      // Simulate checking domain connectivity with politeness delay
      await this.sleep(Math.min(this.profileConfig.politenessDelayMs, 300));
      return { success: true, data: true };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Cannot reach domain ${this.account.domain}: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }

  public async login(): Promise<ConnectorExecutionResult<{ sessionValid: boolean; balance?: number; currency?: string }>> {
    const sessionCheck = browserSessionManager.validateSession(this.account);
    if (!sessionCheck.isValid) {
      if (sessionCheck.health === 'REAUTH_REQUIRED') {
        return {
          success: false,
          error: {
            code: 'ACTION_REQUIRED',
            message: 'CAPTCHA or 2FA challenge detected. Admin action required.',
            retryable: false,
            requiresAction: true
          }
        };
      }
      return {
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: sessionCheck.reason || 'Session expired',
          retryable: false
        }
      };
    }

    // Refresh active session timestamp
    browserSessionManager.refreshSession(this.account.id);

    return {
      success: true,
      data: {
        sessionValid: true,
        balance: this.account.balance,
        currency: this.account.currency
      }
    };
  }

  public async get_categories(): Promise<ConnectorExecutionResult<Array<{ id: string; name: string; url?: string }>>> {
    await this.sleep(this.profileConfig.politenessDelayMs);

    // Standard discovered categories on digital source marketplace
    const sampleCategories = [
      { id: 'cat-steam-wallet', name: 'Steam Wallet & Keys', url: `${this.account.domain}/categories/steam` },
      { id: 'cat-roblox-robux', name: 'Roblox Robux & Items', url: `${this.account.domain}/categories/roblox` },
      { id: 'cat-software-office', name: 'Software & Office 365', url: `${this.account.domain}/categories/software` },
      { id: 'cat-streaming-subs', name: 'Streaming & Entertainment', url: `${this.account.domain}/categories/streaming` },
      { id: 'cat-valorant-points', name: 'Valorant Riot Points', url: `${this.account.domain}/categories/valorant` }
    ];

    return {
      success: true,
      data: sampleCategories
    };
  }

  public async scan_products(
    category?: { id: string; name: string; url?: string },
    onProductFound?: (product: RawScannedProduct) => void
  ): Promise<ConnectorExecutionResult<RawScannedProduct[]>> {
    const products: RawScannedProduct[] = [];
    const catId = category?.id || 'all';

    // Discovered products per category
    const catalogCatalog: Record<string, Array<Omit<RawScannedProduct, 'source_url'>>> = {
      'cat-steam-wallet': [
        { source_product_id: 'stm-100k', title: 'Thẻ Steam Wallet 100.000 VNĐ Code Nạp', original_price: 95000, original_currency: 'VND', stock: 45, source_status: 'IN_STOCK', category_raw: 'Steam Wallet & Keys' },
        { source_product_id: 'stm-200k', title: 'Thẻ Steam Wallet 200.000 VNĐ Code Nạp', original_price: 188000, original_currency: 'VND', stock: 22, source_status: 'IN_STOCK', category_raw: 'Steam Wallet & Keys' },
        { source_product_id: 'stm-500k', title: 'Thẻ Steam Wallet 500.000 VNĐ Code Nạp', original_price: 470000, original_currency: 'VND', stock: 12, source_status: 'IN_STOCK', category_raw: 'Steam Wallet & Keys' }
      ],
      'cat-roblox-robux': [
        { source_product_id: 'rbx-1000r', title: 'Roblox 1,000 Robux Clean Chuyển Group 120H', original_price: 120000, original_currency: 'VND', stock: 180, source_status: 'IN_STOCK', category_raw: 'Roblox Robux & Items' },
        { source_product_id: 'rbx-2000r', title: 'Roblox 2,000 Robux Clean Chuyển Group 120H', original_price: 238000, original_currency: 'VND', stock: 95, source_status: 'IN_STOCK', category_raw: 'Roblox Robux & Items' },
        { source_product_id: 'rbx-gift-10usd', title: 'Thẻ Roblox Gift Card 10$ Digital Global', original_price: 245000, original_currency: 'VND', stock: 14, source_status: 'IN_STOCK', category_raw: 'Roblox Robux & Items' }
      ],
      'cat-software-office': [
        { source_product_id: 'ms-office-365', title: 'Tài khoản Microsoft 365 Family 1 Năm Bản Quyền', original_price: 280000, original_currency: 'VND', stock: 50, source_status: 'IN_STOCK', category_raw: 'Software & Office 365' },
        { source_product_id: 'win-11-pro', title: 'Key Windows 11 Pro Retail Kích Hoạt Vĩnh Viễn', original_price: 99000, original_currency: 'VND', stock: 300, source_status: 'IN_STOCK', category_raw: 'Software & Office 365' },
        { source_product_id: 'canva-pro-edu', title: 'Nâng Cấp Canva Pro Mời Vào Đội Nhóm 1 Năm', original_price: 140000, original_currency: 'VND', stock: 75, source_status: 'IN_STOCK', category_raw: 'Software & Office 365' }
      ],
      'cat-streaming-subs': [
        { source_product_id: 'spotify-prem-1y', title: 'Gia Hạn Spotify Premium 1 Năm Chính Chủ', original_price: 290000, original_currency: 'VND', stock: 35, source_status: 'IN_STOCK', category_raw: 'Streaming & Entertainment' },
        { source_product_id: 'ytb-prem-6m', title: 'Nâng Cấp YouTube Premium 6 Tháng Nhóm Gia Đình', original_price: 180000, original_currency: 'VND', stock: 80, source_status: 'IN_STOCK', category_raw: 'Streaming & Entertainment' },
        { source_product_id: 'netflix-slot-1m', title: 'Tài Khoản Netflix Premium Ultra HD 1 Tháng Riêng Profile', original_price: 65000, original_currency: 'VND', stock: 18, source_status: 'IN_STOCK', category_raw: 'Streaming & Entertainment' }
      ],
      'cat-valorant-points': [
        { source_product_id: 'vlr-points-650', title: 'Nạp 650 Riot Points Valorant Server VN', original_price: 110000, original_currency: 'VND', stock: 110, source_status: 'IN_STOCK', category_raw: 'Valorant Riot Points' },
        { source_product_id: 'vlr-points-1350', title: 'Nạp 1,350 Riot Points Valorant Server VN', original_price: 215000, original_currency: 'VND', stock: 65, source_status: 'IN_STOCK', category_raw: 'Valorant Riot Points' }
      ]
    };

    const items = catalogCatalog[catId] || catalogCatalog['cat-roblox-robux'];

    for (const item of items) {
      await this.sleep(Math.floor(this.profileConfig.politenessDelayMs / 2));
      const fullProduct: RawScannedProduct = {
        ...item,
        source_url: `https://${this.account.domain}/product/${item.source_product_id}`,
        raw_metadata: {
          scannedBy: 'GenericBrowserConnector',
          profileUsed: this.profileConfig.profileId,
          extractedAt: new Date().toISOString()
        }
      };
      products.push(fullProduct);
      if (onProductFound) {
        onProductFound(fullProduct);
      }
    }

    return {
      success: true,
      data: products
    };
  }

  public async get_product_detail(source_product_id: string): Promise<ConnectorExecutionResult<RawScannedProduct>> {
    await this.sleep(this.profileConfig.politenessDelayMs);
    return {
      success: true,
      data: {
        source_product_id,
        source_url: `https://${this.account.domain}/product/${source_product_id}`,
        title: `Product ${source_product_id}`,
        original_price: 150000,
        original_currency: 'VND',
        stock: 50,
        source_status: 'IN_STOCK'
      }
    };
  }

  public async get_product_stock(source_product_id: string): Promise<ConnectorExecutionResult<number>> {
    await this.sleep(200);
    return { success: true, data: 42 };
  }

  public async get_product_price(source_product_id: string): Promise<ConnectorExecutionResult<number>> {
    await this.sleep(200);
    return { success: true, data: 120000 };
  }

  public async get_order_history(): Promise<ConnectorExecutionResult<any[]>> {
    return {
      success: true,
      data: [
        { orderId: 'ORD-9881', product: 'Roblox 1000 Robux', price: 120000, status: 'COMPLETED', date: new Date().toISOString() }
      ]
    };
  }

  public async purchase(
    product_id: string, 
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<ConnectorExecutionResult<{ purchaseId: string; status: string; key?: string; balanceRemaining?: number }>> {
    const unitPrice = 120000;
    const totalCost = unitPrice * quantity;

    if (this.account.balance < totalCost) {
      return {
        success: false,
        error: {
          code: 'SOURCE_UNAVAILABLE',
          message: `Số dư ví nguồn không đủ: Cần ${totalCost.toLocaleString('vi-VN')} VND, hiện có ${this.account.balance.toLocaleString('vi-VN')} VND`,
          retryable: false
        }
      };
    }

    // Deduct balance
    this.account.balance -= totalCost;
    const purchaseId = `PURCHASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const mockKey = `KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      data: {
        purchaseId,
        status: 'COMPLETED',
        key: mockKey,
        balanceRemaining: this.account.balance
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
