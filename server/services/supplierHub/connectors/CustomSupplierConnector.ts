import { ISupplierConnector, ConnectionTestResult } from '../core/ISupplierConnector';
import { 
  ConnectionType, 
  ConnectionCapabilities, 
  SupplierCredentials, 
  NormalizedCategory, 
  NormalizedProduct, 
  SupplierOrderRequest, 
  SupplierOrderResult 
} from '../types';

export class CustomSupplierConnector implements ISupplierConnector {
  public readonly id: string;
  public readonly name: string;
  public readonly websiteUrl: string;
  public readonly connectionType: ConnectionType = 'CUSTOM';
  public readonly capabilities: ConnectionCapabilities = {
    balance: true,
    product_sync: true,
    category_sync: false,
    create_order: true,
    order_status: true,
    cancel_order: false
  };

  private currentBalance = 500000;

  constructor(id: string, name: string, websiteUrl: string) {
    this.id = id;
    this.name = name;
    this.websiteUrl = websiteUrl.replace(/\/$/, '');
  }

  public async connect(credentials: SupplierCredentials): Promise<ConnectionTestResult> {
    return {
      success: true,
      message: 'Kết nối Custom Provider thành công',
      balance: this.currentBalance,
      currency: 'VND'
    };
  }

  public async getBalance(): Promise<{ balance: number; currency: string; status: string }> {
    return {
      balance: this.currentBalance,
      currency: 'VND',
      status: 'ONLINE'
    };
  }

  public async getCategories(): Promise<NormalizedCategory[]> {
    return [{ id: 'custom-cat-misc', name: 'Sản Phẩm Tùy Chỉnh Nguồn Ngoài' }];
  }

  public async getProducts(): Promise<NormalizedProduct[]> {
    return [
      {
        sourceProductId: 'cust-prod-301',
        title: 'Spotify Premium 1 Năm Gia Hạn Email Cá Nhân',
        description: 'Bản quyền nghe nhạc Spotify Premium không quảng cáo, âm thanh chất lượng cao 320kbps',
        category: 'custom-cat-misc',
        originalPrice: 120000,
        originalCurrency: 'VND',
        stockAvailable: 50,
        images: ['https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=500&auto=format&fit=crop'],
        status: 'AVAILABLE'
      }
    ];
  }

  public async getProduct(sourceProductId: string): Promise<NormalizedProduct | null> {
    const list = await this.getProducts();
    return list.find(p => p.sourceProductId === sourceProductId) || null;
  }

  public async createOrder(request: SupplierOrderRequest): Promise<SupplierOrderResult> {
    const cost = 120000 * request.quantity;
    this.currentBalance = Math.max(0, this.currentBalance - cost);
    return {
      success: true,
      supplierOrderReference: `CUST-REF-${Date.now()}`,
      status: 'COMPLETED',
      deliveredKey: `SPOTIFY-UPGRADE-INVITE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      supplierCost: cost,
      supplierBalanceAfter: this.currentBalance
    };
  }

  public async getOrderStatus(supplierOrderRef: string): Promise<{
    status: string;
    deliveredKey?: string;
    completedAt?: string;
  }> {
    return {
      status: 'COMPLETED',
      deliveredKey: `CUST-KEY-${supplierOrderRef}`,
      completedAt: new Date().toISOString()
    };
  }
}
