// ==============================================================================
// CYBERPOOL: SOURCE CONNECTOR MASTER ORCHESTRATOR SERVICE
// ==============================================================================
import { 
  SourceAccount, 
  SourceProduct, 
  SourceScanJob, 
  SourceAuditLog, 
  BlockedSourceProduct, 
  ScanJobType,
  ConnectorExecutionResult,
  RawScannedProduct
} from './types';
import { encryptSecret, maskSecret, sanitizeLogData } from './encryptionUtils';
import { scannerEngine } from './scannerEngine';
import { browserSessionManager } from './browserSessionManager';
import { ConnectorFactory } from './connectors/ConnectorFactory';
import { distributedLock } from './distributedLock';
import { sourceOfferService } from './sourceOfferService';
import { categoryMapper } from './categoryMapper';
import { ProductNormalizer } from './productNormalizer';

export class SourceConnectorService {
  private accounts: Map<string, SourceAccount> = new Map();
  private products: Map<string, SourceProduct> = new Map();
  private scanJobs: Map<string, SourceScanJob> = new Map();
  private blockedProducts: Map<string, BlockedSourceProduct> = new Map();
  private auditLogs: SourceAuditLog[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();

    // 1. Seed Accounts
    const acc1: SourceAccount = {
      id: 'acc_muakey_01',
      name: 'Muakey.com (Tài khoản VIP Reseller)',
      domain: 'muakey.com',
      username: 'reseller_cyberpool@gmail.com',
      encrypted_password: encryptSecret('CyberPool@2026!'),
      encrypted_session: encryptSecret('sess_mky_98fa7210e4bc8199201f9a88'),
      browser_profile_id: 'prof_muakey_01',
      connector_type: 'HYBRID',
      scanner_profile: 'MUAKey_STANDARD',
      status: 'ONLINE',
      balance: 1250000,
      currency: 'VND',
      low_balance_threshold: 200000,
      is_active: true,
      concurrency_limit: 2,
      request_delay_ms: 650,
      last_login_at: now,
      last_scan_at: now,
      last_successful_scan_at: now,
      last_purchase_at: now,
      created_at: now,
      updated_at: now
    };

    const acc2: SourceAccount = {
      id: 'acc_divine_02',
      name: 'DivineShop Direct (Dự phòng B)',
      domain: 'divineshop.vn',
      username: 'cyberpool_admin',
      encrypted_password: encryptSecret('DivinePool@2026!'),
      encrypted_session: encryptSecret('dvn_token_881273aaefbc99'),
      browser_profile_id: 'prof_divine_02',
      connector_type: 'BROWSER',
      scanner_profile: 'SITE_B_DYNAMIC_LOAD_MORE',
      status: 'ONLINE',
      balance: 820000,
      currency: 'VND',
      low_balance_threshold: 300000,
      is_active: true,
      concurrency_limit: 1,
      request_delay_ms: 900,
      last_login_at: now,
      last_scan_at: now,
      last_successful_scan_at: now,
      last_purchase_at: now,
      created_at: now,
      updated_at: now
    };

    const acc3: SourceAccount = {
      id: 'acc_gamekey_03',
      name: 'GameKeyWorld Global (Nguồn US/EU)',
      domain: 'gamekeyworld.com',
      username: 'billing@cyberpool.vn',
      encrypted_password: encryptSecret('GlobalKey#884'),
      encrypted_session: encryptSecret('gkw_sess_expired'),
      browser_profile_id: 'prof_gamekey_03',
      connector_type: 'BROWSER',
      scanner_profile: 'GENERIC_ECOMMERCE_GRID',
      status: 'REAUTH_REQUIRED',
      balance: 0,
      currency: 'VND',
      low_balance_threshold: 500000,
      is_active: false,
      concurrency_limit: 1,
      request_delay_ms: 1200,
      last_login_at: undefined,
      created_at: now,
      updated_at: now
    };

    const accG2up: SourceAccount = {
      id: 'acc_g2up_net',
      name: 'G2UP.NET (Roblox & Game Digital Items Direct API)',
      domain: 'g2up.net',
      username: 'cyborg',
      encrypted_password: encryptSecret('123123ad'),
      // CYBERPOOL FIX: g2up.net không còn yêu cầu API key dùng chung —
      // đã xóa key hardcode '885e5d18...62c0af' khỏi repo.
      encrypted_session: undefined,
      browser_profile_id: 'prof_g2up_cyborg',
      connector_type: 'API',
      scanner_profile: 'G2UP_API_CONNECTOR',
      status: 'ONLINE',
      balance: 100000,
      currency: 'VND',
      low_balance_threshold: 50000,
      is_active: true,
      concurrency_limit: 2,
      request_delay_ms: 400,
      last_login_at: now,
      last_scan_at: now,
      last_successful_scan_at: now,
      created_at: now,
      updated_at: now
    };

    this.accounts.set(accG2up.id, accG2up);
    this.accounts.set(acc1.id, acc1);
    this.accounts.set(acc2.id, acc2);
    this.accounts.set(acc3.id, acc3);

    // Initial seed products for G2UP
    const seedG2upProducts: SourceProduct[] = [
      {
        id: 'sp_acc_g2up_net_g2up-1752',
        source_account_id: 'acc_g2up_net',
        source_product_id: 'g2up-1752',
        source_url: 'https://g2up.net/api/product.php?product=1752',
        title: 'GODHUMAN (Roblox Blox Fruits)',
        description: 'Account Roblox GodHuman - user:pass:cookie 10-day warranty',
        category_raw: 'GOD(warrantly sec 10day)',
        original_price: 5800,
        original_currency: 'VND',
        stock: 4604,
        source_status: 'IN_STOCK',
        raw_data: { g2up_id: '1752', min: '1', max: '1000000' },
        is_sync_ignored: false,
        missing_scan_count: 0,
        auto_sync_price: true,
        first_seen_at: now,
        last_seen_at: now,
        last_synced_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 'sp_acc_g2up_net_g2up-1937',
        source_account_id: 'acc_g2up_net',
        source_product_id: 'g2up-1937',
        source_url: 'https://g2up.net/api/product.php?product=1937',
        title: 'Blox Fruits - Roblox Private Server (Thuê 1 Tháng)',
        description: 'Roblox Private Server VIP link - Rent for 1 month',
        category_raw: 'Roblox private server',
        original_price: 13000,
        original_currency: 'VND',
        stock: 159,
        source_status: 'IN_STOCK',
        raw_data: { g2up_id: '1937', min: '1', max: '1000000' },
        is_sync_ignored: false,
        missing_scan_count: 0,
        auto_sync_price: true,
        first_seen_at: now,
        last_seen_at: now,
        last_synced_at: now,
        created_at: now,
        updated_at: now
      },
      {
        id: 'sp_acc_g2up_net_g2up-1940',
        source_account_id: 'acc_g2up_net',
        source_product_id: 'g2up-1940',
        source_url: 'https://g2up.net/api/product.php?product=1940',
        title: 'Anime Expeditions 200-270k Gem | 200+ Trait Reroll | Level 120+',
        description: 'User:Pass:Cookie - 100% Hero True Saint Crimson',
        category_raw: 'Anime Expeditions GEM',
        original_price: 20000,
        original_currency: 'VND',
        stock: 50,
        source_status: 'IN_STOCK',
        raw_data: { g2up_id: '1940', min: '1', max: '1000000' },
        is_sync_ignored: false,
        missing_scan_count: 0,
        auto_sync_price: true,
        first_seen_at: now,
        last_seen_at: now,
        last_synced_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    for (const p of seedG2upProducts) {
      this.products.set(`${p.source_account_id}:${p.source_product_id}`, p);
      const internalId = `INT-${p.source_product_id.toUpperCase()}`;
      sourceOfferService.upsertOffer({
        id: `offer_${accG2up.id}_${p.source_product_id}`,
        internal_product_id: internalId,
        source_account_id: p.source_account_id,
        source_product_id: p.source_product_id,
        source_name: accG2up.name,
        source_price: p.original_price,
        currency: p.original_currency,
        calculated_final_price: Math.round(p.original_price * 1.05 + 5000),
        stock: p.stock,
        priority: 10,
        status: p.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
        last_verified_at: now,
        created_at: now,
        updated_at: now
      });
    }

    // Initial audit log
    this.recordAuditLog('SYSTEM_BOOT', {
      message: 'Source Connector Engine initialized with G2UP.NET (Account: cyborg) and 3 other accounts'
    });
  }

  // ==========================================
  // ACCOUNT OPERATIONS
  // ==========================================
  public getAccounts(): Array<Omit<SourceAccount, 'encrypted_password' | 'encrypted_session'> & { hasPassword: boolean; hasSession: boolean; maskedUsername: string }> {
    return Array.from(this.accounts.values()).map(acc => ({
      ...acc,
      encrypted_password: undefined,
      encrypted_session: undefined,
      hasPassword: Boolean(acc.encrypted_password),
      hasSession: Boolean(acc.encrypted_session),
      maskedUsername: maskSecret(acc.username)
    }));
  }

  public getAccountById(id: string): SourceAccount | undefined {
    return this.accounts.get(id);
  }

  public createAccount(data: Partial<SourceAccount> & { password?: string; sessionToken?: string }): SourceAccount {
    const id = `acc_${Date.now()}`;
    const now = new Date().toISOString();

    const newAccount: SourceAccount = {
      id,
      name: data.name || 'New Source Account',
      domain: data.domain || 'example.com',
      username: data.username || '',
      encrypted_password: data.password ? encryptSecret(data.password) : undefined,
      encrypted_session: data.sessionToken ? encryptSecret(data.sessionToken) : undefined,
      browser_profile_id: `prof_${id}`,
      connector_type: data.connector_type || 'BROWSER',
      scanner_profile: data.scanner_profile || 'GENERIC_ECOMMERCE_GRID',
      proxy_id: data.proxy_id,
      status: 'ONLINE',
      balance: Number(data.balance) || 0,
      currency: data.currency || 'VND',
      low_balance_threshold: Number(data.low_balance_threshold) || 200000,
      is_active: data.is_active !== undefined ? data.is_active : true,
      concurrency_limit: Number(data.concurrency_limit) || 1,
      request_delay_ms: Number(data.request_delay_ms) || 800,
      created_at: now,
      updated_at: now
    };

    this.accounts.set(id, newAccount);
    this.recordAuditLog('ACCOUNT_CREATED', { accountId: id, name: newAccount.name, domain: newAccount.domain });
    return newAccount;
  }

  public updateAccount(id: string, updates: Partial<SourceAccount> & { password?: string; sessionToken?: string }): SourceAccount | null {
    const account = this.accounts.get(id);
    if (!account) return null;

    if (updates.password) {
      account.encrypted_password = encryptSecret(updates.password);
    }
    if (updates.sessionToken) {
      account.encrypted_session = encryptSecret(updates.sessionToken);
      browserSessionManager.refreshSession(id);
    }

    Object.assign(account, {
      ...updates,
      encrypted_password: account.encrypted_password,
      encrypted_session: account.encrypted_session,
      updated_at: new Date().toISOString()
    });

    this.accounts.set(id, account);
    this.recordAuditLog('ACCOUNT_UPDATED', { accountId: id, updates: sanitizeLogData(updates) });
    return account;
  }

  public async testLogin(id: string): Promise<ConnectorExecutionResult<any>> {
    const account = this.accounts.get(id);
    if (!account) {
      return {
        success: false,
        error: { code: 'SOURCE_AUTH_FAILED', message: 'Account not found', retryable: false }
      };
    }

    const connector = ConnectorFactory.createConnector(account);
    const result = await connector.login();

    if (result.success) {
      account.status = 'ONLINE';
      account.last_login_at = new Date().toISOString();
      if (result.data?.balance !== undefined) {
        account.balance = result.data.balance;
      }
      this.recordAuditLog('LOGIN_SUCCESS', { accountId: id, balance: account.balance });
    } else {
      account.status = result.error?.requiresAction ? 'REAUTH_REQUIRED' : 'LOGIN_FAILED';
      this.recordAuditLog('LOGIN_FAILED', { accountId: id, error: result.error?.message });
    }

    return result;
  }

  // ==========================================
  // SCAN JOB OPERATIONS & IDEMPOTENCY
  // ==========================================
  public triggerScan(accountId: string, scanType: ScanJobType): { job: SourceScanJob; isAlreadyRunning: boolean } {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    // Check Job Idempotency
    const existingActiveJob = Array.from(this.scanJobs.values()).find(
      j => j.source_account_id === accountId && (j.status === 'RUNNING' || j.status === 'QUEUED')
    );

    if (existingActiveJob) {
      return { job: existingActiveJob, isAlreadyRunning: true };
    }

    // Create New Job
    const jobId = `job_${Date.now()}`;
    const newJob: SourceScanJob = {
      id: jobId,
      source_account_id: accountId,
      source_account_name: account.name,
      scan_type: scanType,
      status: 'QUEUED',
      progress: 0,
      total_categories: 0,
      processed_categories: 0,
      total_products: 0,
      processed_products: 0,
      created_count: 0,
      updated_count: 0,
      skipped_count: 0,
      failed_count: 0,
      current_step: 'Queued in scan worker pool',
      correlation_id: `corr_${Date.now()}`,
      created_at: new Date().toISOString()
    };

    this.scanJobs.set(jobId, newJob);

    // Run asynchronously
    const blockedSet = new Set(
      Array.from(this.blockedProducts.values())
        .filter(b => b.source_account_id === accountId)
        .map(b => b.source_product_id)
    );

    setTimeout(async () => {
      await scannerEngine.executeScan(
        account,
        scanType,
        newJob,
        this.products,
        blockedSet,
        (updated) => this.scanJobs.set(updated.id, { ...updated }),
        (upserted) => this.products.set(`${upserted.source_account_id}:${upserted.source_product_id}`, upserted),
        (act, det) => this.recordAuditLog(act, { ...det, sourceAccountId: accountId })
      );
    }, 50);

    return { job: newJob, isAlreadyRunning: false };
  }

  public getScanJobs(): SourceScanJob[] {
    return Array.from(this.scanJobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getScanJobById(id: string): SourceScanJob | undefined {
    return this.scanJobs.get(id);
  }

  // ==========================================
  // PRODUCTS & OFFERS
  // ==========================================
  public getProducts(filters?: { accountId?: string; search?: string; status?: string }): SourceProduct[] {
    let list = Array.from(this.products.values());

    if (filters?.accountId) {
      list = list.filter(p => p.source_account_id === filters.accountId);
    }
    if (filters?.status) {
      list = list.filter(p => p.source_status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.source_product_id.toLowerCase().includes(q));
    }

    return list;
  }

  public upsertScannedProduct(accountId: string, raw: RawScannedProduct): SourceProduct {
    const key = `${accountId}:${raw.source_product_id}`;
    const existing = this.products.get(key);
    const merged = ProductNormalizer.mergeSnapshot(existing, raw, accountId);
    this.products.set(key, merged);
    return merged;
  }

  public updateProduct(id: string, updates: Partial<SourceProduct>): SourceProduct | null {
    const product = Array.from(this.products.values()).find(p => p.id === id);
    if (!product) return null;

    Object.assign(product, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    this.products.set(`${product.source_account_id}:${product.source_product_id}`, product);
    this.recordAuditLog('PRODUCT_UPDATED', { productId: id, updates });
    return product;
  }

  public blockProduct(sourceAccountId: string, sourceProductId: string, reason: string): void {
    const key = `${sourceAccountId}:${sourceProductId}`;
    this.blockedProducts.set(key, {
      id: `blk_${Date.now()}`,
      source_account_id: sourceAccountId,
      source_product_id: sourceProductId,
      reason,
      created_at: new Date().toISOString()
    });
    this.recordAuditLog('PRODUCT_BLOCKED', { sourceAccountId, sourceProductId, reason });
  }

  public executeBulkAction(
    productIds: string[],
    action: 'IGNORE' | 'UNIGNORE' | 'ENABLE' | 'DISABLE' | 'SET_MARKUP',
    payload?: { markupPercent?: number; fixedMarkup?: number }
  ): { updatedCount: number } {
    let count = 0;
    for (const pid of productIds) {
      const prod = Array.from(this.products.values()).find(p => p.id === pid);
      if (prod) {
        if (action === 'IGNORE') prod.is_sync_ignored = true;
        if (action === 'UNIGNORE') prod.is_sync_ignored = false;
        if (action === 'ENABLE') prod.source_status = 'IN_STOCK';
        if (action === 'DISABLE') prod.source_status = 'DISABLED';
        if (action === 'SET_MARKUP' && payload) {
          prod.markup_percent = payload.markupPercent;
          prod.fixed_markup = payload.fixedMarkup;
        }
        prod.updated_at = new Date().toISOString();
        this.products.set(`${prod.source_account_id}:${prod.source_product_id}`, prod);
        count++;
      }
    }
    this.recordAuditLog('BULK_ACTION', { action, count, productIds });
    return { updatedCount: count };
  }

  public getOffers() {
    return sourceOfferService.getAllOffers();
  }

  public routeBestSource(internalProductId: string, quantity: number = 1) {
    return sourceOfferService.routeBestSource(internalProductId, quantity, this.accounts);
  }

  // ==========================================
  // AUDIT LOGGING
  // ==========================================
  public recordAuditLog(action: string, details: Record<string, any>): void {
    const logEntry: SourceAuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      action,
      details: sanitizeLogData(details),
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(): SourceAuditLog[] {
    return this.auditLogs;
  }
}

export const sourceConnectorService = new SourceConnectorService();
