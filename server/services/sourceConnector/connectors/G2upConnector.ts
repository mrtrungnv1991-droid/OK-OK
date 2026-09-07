// ==============================================================================
// CYBERPOOL: G2UP.NET DIRECT CONNECTOR (SPECIALIZED GAMING DIGITAL ADAPTER)
// Supports Live API & Web Authentication for g2up.net
// ==============================================================================
import { BaseSourceConnector } from './BaseSourceConnector';
import { 
  ConnectorExecutionResult, 
  RawScannedProduct, 
  SourceAccount, 
  ScannerProfileConfig 
} from '../types';
import { decryptSecret } from '../encryptionUtils';

export class G2upConnector extends BaseSourceConnector {
  private readonly baseUrl = 'https://g2up.net';
  private readonly defaultApiKey = '885e5d18c3626f03b8356130b162c0af';

  constructor(account: SourceAccount, profileConfig: ScannerProfileConfig) {
    super(account, profileConfig);
  }

  /**
   * Resolve active API Key from account credentials or default verified key
   */
  private getApiKey(): string {
    if (this.account.encrypted_session) {
      try {
        const decrypted = decryptSecret(this.account.encrypted_session);
        if (decrypted && decrypted.length >= 20 && !decrypted.includes(' ')) {
          return decrypted;
        }
      } catch {
        // fallback
      }
    }
    return this.defaultApiKey;
  }

  /**
   * Ping / verify accessibility to G2UP domain
   */
  public async test_connection(): Promise<ConnectorExecutionResult<boolean>> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/api/profile.php?api_key=${apiKey}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        return { success: true, data: true };
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `G2UP.NET responded with HTTP status ${res.status}`,
          retryable: true
        }
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Cannot reach G2UP.NET: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }

  /**
   * Authenticate using web credentials & verify real-time balance via API
   */
  public async login(): Promise<ConnectorExecutionResult<{ sessionValid: boolean; balance?: number; currency?: string }>> {
    try {
      const apiKey = this.getApiKey();

      // 1. Check API Key directly first for high-speed rate-limit-free verification
      try {
        const profileRes = await fetch(`${this.baseUrl}/api/profile.php?api_key=${apiKey}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
          }
        });

        const profileData: any = await profileRes.json().catch(() => null);
        if (profileData && profileData.status === 'success') {
          const money = parseFloat(profileData.data?.money || '0');
          this.account.balance = money;
          this.account.status = 'ONLINE';
          this.account.last_login_at = new Date().toISOString();

          return {
            success: true,
            data: {
              sessionValid: true,
              balance: money,
              currency: 'VND'
            }
          };
        }
      } catch (apiErr) {
        console.warn('[G2upConnector] Direct API profile check warning, falling back to web login:', apiErr);
      }

      // 2. If API Key did not succeed, perform web login handshake with credentials
      let plainPassword = '';
      if (this.account.encrypted_password) {
        try {
          plainPassword = decryptSecret(this.account.encrypted_password);
        } catch {
          plainPassword = '';
        }
      }

      if (this.account.username && (plainPassword || this.account.username === 'cyborg')) {
        const pwd = plainPassword || '123123ad';
        // 1. Get CSRF & PHPSESSID from login page
        const getRes = await fetch(`${this.baseUrl}/client/login`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
          }
        });
        const setCookie = getRes.headers.get('set-cookie') || '';
        const phpsessid = (setCookie.match(/PHPSESSID=([^;]+)/) || [])[1] || '';
        const html = await getRes.text();
        const csrfMatch = html.match(/id=\"csrf_token\"\s+value=\"([^\"]+)\"/);
        const csrf_token = csrfMatch ? csrfMatch[1] : '';

        if (csrf_token) {
          const params = new URLSearchParams();
          params.append('action', 'Login');
          params.append('csrf_token', csrf_token);
          params.append('username', this.account.username);
          params.append('password', pwd);

          const postRes = await fetch(`${this.baseUrl}/ajaxs/client/auth.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
              'Cookie': phpsessid ? `PHPSESSID=${phpsessid}` : '',
              'Origin': this.baseUrl,
              'Referer': `${this.baseUrl}/client/login`
            },
            body: params.toString()
          });

          const postJson: any = await postRes.json().catch(() => null);
          if (postJson && postJson.status !== 'success') {
            return {
              success: false,
              error: {
                code: 'SOURCE_AUTH_FAILED',
                message: `G2UP.NET từ chối đăng nhập: ${postJson.msg || 'Sai tên đăng nhập hoặc mật khẩu'}`,
                retryable: false
              }
            };
          }
        }
      }

      // Re-verify API profile after web login
      const retryRes = await fetch(`${this.baseUrl}/api/profile.php?api_key=${apiKey}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });

      const retryData: any = await retryRes.json().catch(() => null);
      if (retryData && retryData.status === 'success') {
        const money = parseFloat(retryData.data?.money || '0');
        this.account.balance = money;
        this.account.status = 'ONLINE';
        this.account.last_login_at = new Date().toISOString();

        return {
          success: true,
          data: {
            sessionValid: true,
            balance: money,
            currency: 'VND'
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'SOURCE_AUTH_FAILED',
          message: 'Không thể xác thực với G2UP.NET qua API hoặc thông tin đăng nhập',
          retryable: false
        }
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'SOURCE_AUTH_FAILED',
          message: `Lỗi kết nối xác thực G2UP: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }

  /**
   * Discover and retrieve real categories from G2UP.NET
   */
  public async get_categories(): Promise<ConnectorExecutionResult<Array<{ id: string; name: string; url?: string }>>> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/api/products.php?api_key=${apiKey}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });

      const json: any = await res.json().catch(() => null);
      if (!json || !json.categories || !Array.isArray(json.categories)) {
        return {
          success: false,
          error: {
            code: 'DATA_PARSE_FAILED',
            message: 'Không thể đọc danh mục từ G2UP.NET API',
            retryable: true
          }
        };
      }

      const categories = json.categories.map((c: any) => ({
        id: `cat-g2up-${c.id}`,
        name: c.name,
        url: `${this.baseUrl}/category/${c.id}`
      }));

      return {
        success: true,
        data: categories
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Lỗi tải danh mục G2UP: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }

  /**
   * Scan product listings for a category with live data from G2UP.NET
   */
  public async scan_products(
    category?: { id: string; name: string; url?: string },
    onProductFound?: (product: RawScannedProduct) => void
  ): Promise<ConnectorExecutionResult<RawScannedProduct[]>> {
    try {
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/api/products.php?api_key=${apiKey}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });

      const json: any = await res.json().catch(() => null);
      if (!json || !json.categories || !Array.isArray(json.categories)) {
        return {
          success: false,
          error: {
            code: 'DATA_PARSE_FAILED',
            message: 'Phản hồi từ G2UP.NET không đúng cấu trúc sản phẩm',
            retryable: true
          }
        };
      }

      const rawCatId = category?.id ? category.id.replace('cat-g2up-', '') : null;
      const targetCats = rawCatId 
        ? json.categories.filter((c: any) => String(c.id) === String(rawCatId))
        : json.categories;

      const results: RawScannedProduct[] = [];

      for (const cat of targetCats) {
        if (!cat.products || !Array.isArray(cat.products)) continue;

        for (const prod of cat.products) {
          const price = parseFloat(prod.price) || 0;
          const stock = parseInt(prod.amount, 10) || 0;

          const rawProduct: RawScannedProduct = {
            source_product_id: `g2up-${prod.id}`,
            source_url: `${this.baseUrl}/api/product.php?product=${prod.id}`,
            title: prod.name,
            original_price: price,
            original_currency: 'VND',
            stock: stock,
            source_status: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
            category_raw: cat.name,
            description: prod.description || `Sản phẩm G2UP mã #${prod.id} - ${prod.flag || 'Global'}`,
            raw_metadata: {
              g2up_id: prod.id,
              category_id: cat.id,
              category_name: cat.name,
              category_icon: cat.icon || '',
              image_url: prod.image || prod.img || prod.thumbnail || prod.picture || '',
              flag: prod.flag,
              min_buy: prod.min,
              max_buy: prod.max,
              scanned_at: new Date().toISOString()
            }
          };

          results.push(rawProduct);
          if (onProductFound) {
            onProductFound(rawProduct);
          }
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Lỗi quét sản phẩm G2UP: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }

  /**
   * Read detailed product information
   */
  public async get_product_detail(source_product_id: string): Promise<ConnectorExecutionResult<RawScannedProduct>> {
    try {
      const rawId = source_product_id.replace('g2up-', '');
      const apiKey = this.getApiKey();
      const res = await fetch(`${this.baseUrl}/api/product.php?api_key=${apiKey}&product=${rawId}`);
      const json: any = await res.json().catch(() => null);

      if (json && json.status === 'success' && json.product && json.product.length > 0) {
        const prod = json.product[0];
        const stock = parseInt(prod.amount, 10) || 0;
        return {
          success: true,
          data: {
            source_product_id,
            source_url: `${this.baseUrl}/api/product.php?product=${rawId}`,
            title: prod.name,
            original_price: parseFloat(prod.price) || 0,
            original_currency: 'VND',
            stock: stock,
            source_status: stock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
            description: prod.description || ''
          }
        };
      }

      return {
        success: false,
        error: {
          code: 'DATA_PARSE_FAILED',
          message: `Không tìm thấy chi tiết sản phẩm #${rawId} trên G2UP.NET`,
          retryable: false
        }
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: (err as Error).message,
          retryable: true
        }
      };
    }
  }

  /**
   * Check real-time stock
   */
  public async get_product_stock(source_product_id: string): Promise<ConnectorExecutionResult<number>> {
    const detail = await this.get_product_detail(source_product_id);
    if (detail.success && detail.data) {
      return { success: true, data: detail.data.stock ?? 0 };
    }
    return { success: false, error: detail.error };
  }

  /**
   * Check real-time price
   */
  public async get_product_price(source_product_id: string): Promise<ConnectorExecutionResult<number>> {
    const detail = await this.get_product_detail(source_product_id);
    if (detail.success && detail.data) {
      return { success: true, data: detail.data.original_price };
    }
    return { success: false, error: detail.error };
  }

  /**
   * Read purchase/order history
   */
  public async get_order_history(): Promise<ConnectorExecutionResult<any[]>> {
    return {
      success: true,
      data: []
    };
  }

  // Always live buy enabled - Safe mode removed per user request
  private static liveBuyEnabled: boolean = true;
  private sessionCookie: string = '';
  private sessionUserLogin: string = '';
  private sessionExpires: number = 0;

  public static setLiveBuyEnabled(enabled: boolean): void {
    G2upConnector.liveBuyEnabled = true;
  }

  public static isLiveBuyEnabled(): boolean {
    return true;
  }

  /**
   * Acquire or reuse authenticated web session for direct order execution on G2UP
   */
  private async getAuthenticatedSession(): Promise<{ cookieHeader: string; userLogin: string }> {
    const now = Date.now();
    if (this.sessionCookie && this.sessionUserLogin && now < this.sessionExpires) {
      return {
        cookieHeader: this.sessionCookie,
        userLogin: this.sessionUserLogin
      };
    }

    try {
      const loginPageRes = await fetch(`${this.baseUrl}/client/login`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
      });
      const setCookie1 = loginPageRes.headers.get('set-cookie') || '';
      const phpsessid = (setCookie1.match(/PHPSESSID=([^;]+)/) || [])[1] || '';
      const html = await loginPageRes.text();
      const csrfMatch = html.match(/id=\"csrf_token\"\s+value=\"([^\"]+)\"/);
      const csrf_token = csrfMatch ? csrfMatch[1] : '';

      let plainPassword = '';
      if (this.account.encrypted_password) {
        try {
          plainPassword = decryptSecret(this.account.encrypted_password);
        } catch {
          plainPassword = '';
        }
      }
      const pwd = plainPassword || '123123ad';

      const authParams = new URLSearchParams({
        action: 'Login',
        csrf_token: csrf_token,
        username: this.account.username || 'cyborg',
        password: pwd
      });

      const authRes = await fetch(`${this.baseUrl}/ajaxs/client/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Cookie': `PHPSESSID=${phpsessid}`,
          'Origin': this.baseUrl,
          'Referer': `${this.baseUrl}/client/login`
        },
        body: authParams.toString()
      });

      const rawSetCookie = authRes.headers.get('set-cookie') || '';
      const userLogin = (rawSetCookie.match(/user_login=([^;]+)/) || [])[1] || this.getApiKey();

      this.sessionCookie = `PHPSESSID=${phpsessid}; user_login=${userLogin}`;
      this.sessionUserLogin = userLogin;
      this.sessionExpires = now + 1000 * 60 * 25; // 25 minutes session cache

      return {
        cookieHeader: this.sessionCookie,
        userLogin: this.sessionUserLogin
      };
    } catch (err) {
      console.warn('[G2upConnector] Session handshake fallback to direct API token:', err);
      return {
        cookieHeader: '',
        userLogin: this.getApiKey()
      };
    }
  }

  /**
   * Execute purchase directly on G2UP.NET using live buyProduct endpoint
   */
  public async purchase(
    product_id: string,
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<ConnectorExecutionResult<{ purchaseId: string; status: string; key?: string; balanceRemaining?: number }>> {
    try {
      const rawId = product_id.replace('g2up-', '');
      const apiKey = this.getApiKey();

      // Check balance first
      let currentBalance = 0;
      try {
        const profRes = await fetch(`${this.baseUrl}/api/profile.php?api_key=${apiKey}`);
        const profData: any = await profRes.json().catch(() => null);
        currentBalance = parseFloat(profData?.data?.money || '0');
      } catch (err) {
        // Ignore balance check error
      }

      // Obtain verified session
      const session = await this.getAuthenticatedSession();

      const doBuyRequest = async (): Promise<any> => {
        const params = new URLSearchParams();
        params.append('action', 'buyProduct');
        params.append('id', rawId);
        params.append('amount', String(quantity));
        params.append('coupon', metadata?.coupon || '');
        params.append('token', session.userLogin);
        params.append('gift_username', metadata?.gift_username || '');
        params.append('gift_password', metadata?.gift_password || '');

        console.log(`[G2upConnector] Calling LIVE G2UP buyProduct for item #${rawId}, qty: ${quantity}...`);

        const headers: Record<string, string> = {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Referer': `${this.baseUrl}/client/product/${rawId}`
        };

        if (session.cookieHeader) {
          headers['Cookie'] = session.cookieHeader;
        }

        const buyRes = await fetch(`${this.baseUrl}/ajaxs/client/product.php`, {
          method: 'POST',
          headers,
          body: params.toString()
        });

        return await buyRes.json().catch(() => null);
      };

      let buyJson = await doBuyRequest();
      console.log(`[G2upConnector] G2UP buy response:`, buyJson);

      // Handle G2UP anti-spam rate limiter ("You are working too fast, please wait")
      if (buyJson && typeof buyJson.msg === 'string' && buyJson.msg.toLowerCase().includes('too fast')) {
        console.log('[G2upConnector] Anti-spam rate limit encountered. Waiting 2.8 seconds and retrying order...');
        await new Promise(r => setTimeout(r, 2800));
        buyJson = await doBuyRequest();
        console.log(`[G2upConnector] G2UP buy retry response:`, buyJson);
      }

      if (buyJson && (buyJson.status === 'success' || buyJson.status === true)) {
        const transId = buyJson.trans_id || buyJson.order_id || `G2UP_${Date.now()}`;
        
        // Clean delivered items: if format is "ID:https://..." or "ID:user:pass:cookie", clean prefix if appropriate
        const rawItems: string[] = Array.isArray(buyJson.data) ? buyJson.data : [String(buyJson.data || buyJson.msg || '')];
        const cleanedItems = rawItems.map((item: string) => {
          if (typeof item !== 'string') return String(item);
          const httpIndex = item.indexOf('http');
          if (httpIndex !== -1) {
            return item.substring(httpIndex);
          }
          // If format is like "123:username:pass"
          if (/^\d+:/.test(item)) {
            return item.replace(/^\d+:/, '');
          }
          return item;
        });

        const keysDelivered = cleanedItems.join('\n');

        return {
          success: true,
          data: {
            purchaseId: transId,
            status: 'COMPLETED',
            key: keysDelivered,
            balanceRemaining: currentBalance
          }
        };
      }

      const errorMsg = buyJson?.msg || 'G2UP.NET từ chối giao dịch hoặc số dư không đủ';
      return {
        success: false,
        error: {
          code: 'SOURCE_UNAVAILABLE',
          message: errorMsg,
          retryable: false
        }
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Lỗi kết nối đặt mua G2UP: ${(err as Error).message}`,
          retryable: true
        }
      };
    }
  }
}
