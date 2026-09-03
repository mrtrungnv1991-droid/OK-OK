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
  ConnectorExecutionResult
} from './types';
import { encryptSecret, maskSecret, sanitizeLogData } from './encryptionUtils';
import { scannerEngine } from './scannerEngine';
import { browserSessionManager } from './browserSessionManager';
import { ConnectorFactory } from './connectors/ConnectorFactory';
import { distributedLock } from './distributedLock';
import { sourceOfferService } from './sourceOfferService';
import { categoryMapper } from './categoryMapper';

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

    this.accounts.set(acc1.id, acc1);
    this.accounts.set(acc2.id, acc2);
    this.accounts.set(acc3.id, acc3);

    // Initial audit log
    this.recordAuditLog('SYSTEM_BOOT', {
      message: 'Source Connector Engine initialized with 3 source accounts'
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
