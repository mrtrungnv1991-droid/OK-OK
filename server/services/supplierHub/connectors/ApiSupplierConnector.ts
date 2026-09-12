import { ISupplierConnector, ConnectionTestResult, ConnectionDiagnostics, DiagnosticStep } from '../core/ISupplierConnector';
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
import { decryptSecret } from '../../sourceConnector/encryptionUtils';
import { HttpSessionClient } from '../core/HttpSessionClient';
import { ProductScanner } from '../scanner/ProductScanner';
import { ProviderAdapterConfig, PRESET_ADAPTERS } from '../core/ProviderAdapterConfig';

export class ApiSupplierConnector implements ISupplierConnector {
  public readonly id: string;
  public readonly name: string;
  public readonly websiteUrl: string;
  public readonly connectionType: ConnectionType = 'API';
  public readonly capabilities: ConnectionCapabilities = {
    balance: true,
    product_sync: true,
    category_sync: true,
    create_order: true,
    order_status: true,
    cancel_order: true
  };

  private client: HttpSessionClient;
  private scanner: ProductScanner;
  private adapterConfig: ProviderAdapterConfig;
  private apiKey = '';
  private liveBalance = 0;

  constructor(id: string, name: string, websiteUrl: string, customConfig?: Partial<ProviderAdapterConfig>) {
    this.id = id;
    this.name = name;
    this.websiteUrl = websiteUrl.replace(/\/$/, '');
    this.client = new HttpSessionClient();

    // Default to GENERIC_REST or customConfig
    const urlLower = this.websiteUrl.toLowerCase();
    let basePreset = PRESET_ADAPTERS.GENERIC_REST;
    if (urlLower.includes('dummyjson.com')) {
      basePreset = PRESET_ADAPTERS.DUMMYJSON_DEMO;
    } else if (urlLower.includes('g2up') || urlLower.includes('cmsnt')) {
      basePreset = PRESET_ADAPTERS.G2UP_CMSNT;
    } else if (urlLower.includes('shopclone')) {
      basePreset = PRESET_ADAPTERS.SHOPCLONE7;
    }

    this.adapterConfig = {
      ...basePreset,
      ...customConfig
    };

    this.scanner = new ProductScanner(this.client, this.websiteUrl, this.adapterConfig);
  }

  public async connect(credentials: SupplierCredentials): Promise<ConnectionTestResult> {
    let rawKey = '';
    if (credentials.apiKeyEncrypted) {
      try {
        rawKey = decryptSecret(credentials.apiKeyEncrypted);
      } catch (err) {
        console.warn('[ApiSupplierConnector] decryptSecret error:', err);
      }
    }
    if (!rawKey && (credentials as any).apiKey) {
      rawKey = (credentials as any).apiKey;
    }
    if (!rawKey && (this.websiteUrl.toLowerCase().includes('g2up') || this.websiteUrl.toLowerCase().includes('cmsnt'))) {
      rawKey = '885e5d18c3626f03b8356130b162c0af';
    }
    this.apiKey = rawKey;

    const steps: DiagnosticStep[] = [];
    const diagnostics: ConnectionDiagnostics = {
      network: 'FAIL',
      authentication: 'SKIPPED',
      account: 'SKIPPED',
      session: 'SKIPPED',
      balance: 'NOT_SUPPORTED',
      categories: 'FAIL',
      products: 'FAIL',
      overallStatus: 'DISCONNECTED',
      steps
    };

    // Prepare auth headers
    const authHeaders: Record<string, string> = {};
    if (rawKey) {
      if (this.adapterConfig.authMethod === 'API_KEY_HEADER') {
        const headerName = this.adapterConfig.authHeaderName || 'X-API-Key';
        authHeaders[headerName] = rawKey;
      } else if (this.adapterConfig.authMethod === 'BEARER_TOKEN' || this.adapterConfig.authMethod === 'NONE') {
        const prefix = this.adapterConfig.authHeaderPrefix || 'Bearer ';
        authHeaders['Authorization'] = `${prefix}${rawKey}`.trim();
      }
    }

    // Configure scanner with API key and headers
    this.scanner.setAuth(this.apiKey, authHeaders);

    // STEP 1: Real Network Ping
    const t0 = Date.now();
    let pingRes;
    try {
      pingRes = await this.client.get(this.websiteUrl, {
        headers: authHeaders,
        timeoutMs: 12000
      });
      diagnostics.network = pingRes.status < 500 ? 'PASS' : 'FAIL';
      steps.push({
        step: 'Network Connectivity',
        status: diagnostics.network,
        message: `HTTP ${pingRes.status} ${pingRes.statusText} (${pingRes.durationMs}ms)`,
        durationMs: Date.now() - t0
      });
    } catch (err: any) {
      diagnostics.network = 'FAIL';
      diagnostics.overallStatus = 'ERROR';
      diagnostics.reason = `Không thể kết nối tới máy chủ API (${this.websiteUrl}): ${err.message}`;
      steps.push({
        step: 'Network Connectivity',
        status: 'FAIL',
        message: diagnostics.reason,
        durationMs: Date.now() - t0
      });
      return {
        success: false,
        message: diagnostics.reason,
        diagnostics
      };
    }

    // STEP 2: Authenticate with API Key
    const tAuth = Date.now();
    if (rawKey || this.adapterConfig.authMethod === 'NONE') {
      if (pingRes.status === 401 || pingRes.status === 403) {
        diagnostics.authentication = 'FAIL';
        diagnostics.overallStatus = 'AUTH_FAILED';
        diagnostics.reason = 'Mã API Key không hợp lệ hoặc không có quyền truy cập (401/403 Forbidden)';
        steps.push({
          step: 'API Authentication',
          status: 'FAIL',
          message: diagnostics.reason,
          durationMs: Date.now() - tAuth
        });
        return {
          success: false,
          message: diagnostics.reason,
          diagnostics
        };
      } else {
        diagnostics.authentication = 'PASS';
        diagnostics.session = 'PASS';
        steps.push({
          step: 'API Authentication',
          status: 'PASS',
          message: 'API Key được chấp nhận bởi máy chủ API nguồn',
          durationMs: Date.now() - tAuth
        });
      }
    } else {
      steps.push({
        step: 'API Authentication',
        status: 'SKIPPED',
        message: 'Chưa cấu hình API Key'
      });
    }

    // STEP 3: Check Balance
    const tBal = Date.now();
    try {
      const balRes = await this.getBalance();
      this.liveBalance = balRes.balance;
      diagnostics.balance = 'PASS';
      steps.push({
        step: 'API Wallet Balance',
        status: 'PASS',
        message: `Số dư ví API: ${new Intl.NumberFormat('vi-VN').format(this.liveBalance)} ${balRes.currency}`,
        durationMs: Date.now() - tBal
      });
    } catch {
      diagnostics.balance = 'NOT_SUPPORTED';
      steps.push({
        step: 'API Wallet Balance',
        status: 'SKIPPED',
        message: 'Endpoint số dư ví chưa được cấu hình hoặc không khả dụng'
      });
    }

    // STEP 4: Test Categories
    const tCat = Date.now();
    try {
      const categories = await this.scanner.scanCategories();
      diagnostics.categories = categories.length > 0 ? 'PASS' : 'FAIL';
      steps.push({
        step: 'Categories Discovery',
        status: diagnostics.categories,
        message: `Đã phát hiện ${categories.length} danh mục qua API`,
        durationMs: Date.now() - tCat
      });
    } catch (err: any) {
      diagnostics.categories = 'FAIL';
      steps.push({
        step: 'Categories Discovery',
        status: 'FAIL',
        message: `Lỗi khi gọi endpoint danh mục: ${err.message}`,
        durationMs: Date.now() - tCat
      });
    }

    // STEP 5: Test Products Discovery
    const tProd = Date.now();
    try {
      const products = await this.scanner.scanProducts();
      diagnostics.products = products.length > 0 ? 'PASS' : 'FAIL';
      steps.push({
        step: 'Products Discovery',
        status: diagnostics.products,
        message: `Quét thành công ${products.length} sản phẩm thực tế từ API`,
        durationMs: Date.now() - tProd
      });
    } catch (err: any) {
      diagnostics.products = 'FAIL';
      steps.push({
        step: 'Products Discovery',
        status: 'FAIL',
        message: `Lỗi khi gọi endpoint sản phẩm: ${err.message}`,
        durationMs: Date.now() - tProd
      });
    }

    if (diagnostics.network === 'PASS' && (diagnostics.products === 'PASS' || diagnostics.categories === 'PASS')) {
      diagnostics.overallStatus = 'CONNECTED';
      return {
        success: true,
        message: `Kết nối API Gateway thành công (${steps.filter(s => s.status === 'PASS').length}/${steps.length} checks PASS)`,
        balance: this.liveBalance,
        currency: 'VND',
        diagnostics
      };
    } else {
      diagnostics.overallStatus = 'DEGRADED';
      return {
        success: false,
        message: 'Kết nối API ở trạng thái DEGRADED. Vui lòng kiểm tra chi tiết cấu hình endpoint.',
        diagnostics
      };
    }
  }

  public async getBalance(): Promise<{ balance: number; currency: string; status: string }> {
    if (!this.apiKey && (this.websiteUrl.toLowerCase().includes('g2up') || this.websiteUrl.toLowerCase().includes('cmsnt'))) {
      this.apiKey = '885e5d18c3626f03b8356130b162c0af';
    }

    const balEp = this.adapterConfig.endpoints.balance;
    if (!balEp || !balEp.path) {
      return { balance: this.liveBalance, currency: 'VND', status: 'ONLINE' };
    }

    let url = `${this.websiteUrl}${balEp.path.startsWith('/') ? '' : '/'}${balEp.path}`;
    if (this.adapterConfig.authMethod === 'QUERY_PARAM' && this.apiKey) {
      const qParam = this.adapterConfig.authQueryParamName || 'api_key';
      url += `${url.includes('?') ? '&' : '?'}${qParam}=${encodeURIComponent(this.apiKey)}`;
    }

    const res = await this.client.get(url, { timeoutMs: 8000 });
    if (res.status === 200 && res.data) {
      const raw = res.data.data?.money || res.data.data?.balance || res.data.balance || res.data.wallet || res.data.money || res.data.amount || 0;
      this.liveBalance = Number(raw) || 0;
    }

    return {
      balance: this.liveBalance,
      currency: 'VND',
      status: 'ONLINE'
    };
  }

  public async getCategories(): Promise<NormalizedCategory[]> {
    if (!this.apiKey && (this.websiteUrl.toLowerCase().includes('g2up') || this.websiteUrl.toLowerCase().includes('cmsnt'))) {
      this.apiKey = '885e5d18c3626f03b8356130b162c0af';
    }
    if (this.apiKey) {
      this.scanner.setAuth(this.apiKey);
    }
    return this.scanner.scanCategories();
  }

  public async getProducts(): Promise<NormalizedProduct[]> {
    if (!this.apiKey && (this.websiteUrl.toLowerCase().includes('g2up') || this.websiteUrl.toLowerCase().includes('cmsnt'))) {
      this.apiKey = '885e5d18c3626f03b8356130b162c0af';
    }
    if (this.apiKey) {
      this.scanner.setAuth(this.apiKey);
    }
    return this.scanner.scanProducts();
  }

  public async getProduct(sourceProductId: string): Promise<NormalizedProduct | null> {
    const list = await this.getProducts();
    return list.find(p => p.sourceProductId === sourceProductId) || null;
  }

  public async createOrder(request: SupplierOrderRequest): Promise<SupplierOrderResult> {
    const product = await this.getProduct(request.supplierProductId);
    const cost = (product?.originalPrice || 50000) * request.quantity;

    if (this.liveBalance > 0 && this.liveBalance < cost) {
      return {
        success: false,
        status: 'FAILED',
        supplierCost: cost,
        errorCode: 'INSUFFICIENT_BALANCE',
        errorMessage: 'Số dư ví API không đủ để mua hàng từ nguồn'
      };
    }

    const orderEp = this.adapterConfig.endpoints.createOrder;
    if (orderEp && orderEp.path) {
      try {
        const orderUrl = `${this.websiteUrl}${orderEp.path.startsWith('/') ? '' : '/'}${orderEp.path}`;
        const res = await this.client.post(orderUrl, {
          product_id: request.supplierProductId,
          quantity: request.quantity,
          idempotency_key: request.idempotencyKey,
          order_id: request.localOrderId
        }, { timeoutMs: 15000 });

        if (res.status === 200) {
                  const ref = res.data?.order_id || res.data?.order_ref || `API-ORD-${Date.now()}`;
                  const delivered = res.data?.key || res.data?.license_key || res.data?.delivered_item;
                  this.liveBalance = Math.max(0, this.liveBalance - cost);

                  // CYBERPOOL FIX (F04): never fabricate a delivery key. If the
                  // supplier did not actually return a key/license, the order must NOT
                  // be marked COMPLETED — the customer would have paid real money for
                  // a fake key. Fail loudly so the order flow can refund.
                  if (!delivered) {
                    return {
                      success: false,
                      status: 'FAILED',
                      supplierOrderReference: String(ref),
                      supplierCost: cost,
                      errorCode: 'SUPPLIER_NO_KEY',
                      errorMessage: 'Supplier created the order but did not return a delivery key/license. Order will not be marked delivered.'
                    };
                  }

                  return {
                    success: true,
                    status: 'COMPLETED',
                    supplierOrderReference: String(ref),
                    deliveredKey: String(delivered),
                    supplierCost: cost,
                    supplierBalanceAfter: this.liveBalance
                  };
                }
              } catch (err: any) {
                return {
                  success: false,
                  status: 'FAILED',
                  supplierCost: cost,
                  errorCode: 'SUPPLIER_ERROR',
                  errorMessage: `Lỗi kết nối API đặt hàng: ${err.message}`
                };
              }
            }

            // CYBERPOOL FIX (F04): no real createOrder endpoint is configured — this
            // is a dead path that previously fabricated an "API-AUTO-LICENSE-..." key
            // and charged the customer for it. Fail instead.
            return {
              success: false,
              status: 'FAILED',
              supplierCost: cost,
              errorCode: 'SUPPLIER_ENDPOINT_MISSING',
              errorMessage: 'Không có endpoint createOrder được cấu hình cho supplier này. Không thể giao hàng.'
            };
          }

  public async getOrderStatus(supplierOrderRef: string): Promise<{
      status: string;
      deliveredKey?: string;
      completedAt?: string;
    }> {
      // CYBERPOOL FIX (F04): never fabricate a delivered key for a status poll.
      return {
        status: 'PENDING',
        completedAt: new Date().toISOString()
      };
    }
}
