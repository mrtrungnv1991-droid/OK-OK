import { SupplierManagerService } from './supplierHub/services/SupplierManagerService';
import { cyborgPipelineService } from './sourceConnector/cyborgPipelineService';
import { db } from '../db/store';
import fs from 'fs';
import path from 'path';

export interface CronLogItem {
  id: string;
  timestamp: string;
  trigger: 'auto_interval' | 'manual_admin' | 'external_webhook';
  durationMs: number;
  suppliersChecked: number;
  totalProductsScanned: number;
  totalStockUpdated: number;
  outOfStockDetected: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details: string;
}

export interface CronConfig {
  enabled: boolean;
  intervalSeconds: number; // e.g. 60s
  autoHideOutOfStock: boolean;
  notificationOnOutOfStock: boolean;
}

export interface CronStatus {
  isActive: boolean;
  isExecuting: boolean;
  config: CronConfig;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  totalOutOfStockFound: number;
  uptimeSeconds: number;
  recentLogs: CronLogItem[];
}

const CRON_CONFIG_FILE = path.join(process.cwd(), 'server', 'data', 'supplier_hub', 'cron_config.json');

export class CronService {
  private static timer: NodeJS.Timeout | null = null;
  private static isExecuting = false;
  private static startTime = Date.now();
  private static lastRunAt: string | null = null;
  private static nextRunAt: string | null = null;
  private static totalRuns = 0;
  private static totalOutOfStockFound = 0;
  private static logs: CronLogItem[] = [];

  private static config: CronConfig = {
    enabled: true,
    intervalSeconds: 60, // Auto sync every 60s
    autoHideOutOfStock: false,
    notificationOnOutOfStock: true
  };

  public static init() {
    this.loadConfig();
    console.log(`⏱️ [CronService] Initializing resilient background cron daemon (Interval: ${this.config.intervalSeconds}s)...`);

    // Reschedule interval
    this.scheduleNextTick();

    // Run first sync shortly after boot (after 4 seconds)
    setTimeout(() => {
      this.tick('auto_interval').catch(err => {
        console.warn('[CronService] Initial boot tick error:', err);
      });
    }, 4000);
  }

  private static scheduleNextTick() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (!this.config.enabled) {
      this.nextRunAt = null;
      console.log('[CronService] Background cron is disabled by config.');
      return;
    }

    const intervalMs = Math.max(15, this.config.intervalSeconds) * 1000;
    this.nextRunAt = new Date(Date.now() + intervalMs).toISOString();

    this.timer = setInterval(() => {
          this.tick('auto_interval').catch(err => {
            console.error('[CronService] Uncaught tick error:', err);
          });
        }, intervalMs).unref(); // .unref: don't keep the process alive in tests
  }

  private static loadConfig() {
    try {
      if (fs.existsSync(CRON_CONFIG_FILE)) {
        const raw = fs.readFileSync(CRON_CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.config = { ...this.config, ...parsed };
      }
    } catch (err) {
      console.warn('[CronService] Error reading cron_config.json, using defaults:', err);
    }
  }

  private static saveConfig() {
    try {
      const dir = path.dirname(CRON_CONFIG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CRON_CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (err) {
      console.error('[CronService] Error saving cron_config.json:', err);
    }
  }

  public static updateConfig(newConfig: Partial<CronConfig>): CronConfig {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.scheduleNextTick();
    return this.config;
  }

  public static getConfig(): CronConfig {
    return { ...this.config };
  }

  /**
   * Main cron execution tick:
   * 1. Iterates over active suppliers
   * 2. Scans live stock and products
   * 3. Detects products that are sold out (stock = 0 or missing from shop API)
   * 4. Updates db.products and persists state
   */
  public static async tick(trigger: 'auto_interval' | 'manual_admin' | 'external_webhook' = 'auto_interval'): Promise<{
    success: boolean;
    durationMs: number;
    suppliersChecked: number;
    totalProductsScanned: number;
    totalStockUpdated: number;
    outOfStockDetected: number;
    message: string;
  }> {
    if (this.isExecuting) {
      return {
        success: false,
        durationMs: 0,
        suppliersChecked: 0,
        totalProductsScanned: 0,
        totalStockUpdated: 0,
        outOfStockDetected: 0,
        message: 'Cron job is already running, skipping overlapping execution.'
      };
    }

    this.isExecuting = true;
    const t0 = Date.now();
    this.totalRuns++;
    this.lastRunAt = new Date().toISOString();
    this.nextRunAt = new Date(Date.now() + Math.max(15, this.config.intervalSeconds) * 1000).toISOString();

    let suppliersChecked = 0;
    let totalProductsScanned = 0;
    let totalStockUpdated = 0;
    let outOfStockDetected = 0;
    const detailParts: string[] = [];

    try {
      // 1. Scan and sync connected Hub suppliers (G2UP, CMSNT, ShopClone, API Suppliers)
      const allSuppliers = SupplierManagerService.getAllSuppliers();
      const activeSuppliers = allSuppliers.filter(
        s => s.status === 'ACTIVE' && s.connectionStatus === 'CONNECTED' && s.autoSyncEnabled !== false
      );

      suppliersChecked = activeSuppliers.length;

      for (const sup of activeSuppliers) {
        try {
          // Track out of stock count before sync for this supplier
          const syncResult = await SupplierManagerService.runProductSync(sup.id, 'FULL');
          if (syncResult.success) {
            totalProductsScanned += syncResult.job.totalDiscovered;
            totalStockUpdated += syncResult.job.totalUpdated + syncResult.job.totalCreated;

            // Count out-of-stock items in this supplier
            const outOfStockInSup = db.products.filter(
              p => (p.source_info?.supplierId === sup.id || (p.tags && p.tags.includes(sup.id))) &&
                   (p.stockAvailable <= 0 || p.status === 'OUT_OF_STOCK')
            ).length;

            outOfStockDetected += outOfStockInSup;
            detailParts.push(`${sup.name}: Quét ${syncResult.job.totalDiscovered} sp, ${outOfStockInSup} hết hàng`);
          } else {
            detailParts.push(`${sup.name}: Lỗi đồng bộ (${syncResult.job.error || 'Unknown'})`);
          }
        } catch (supErr: any) {
          console.warn(`[CronService] Error syncing supplier ${sup.name}:`, supErr.message);
          detailParts.push(`${sup.name}: Ngoại lệ (${supErr.message})`);
        }
      }

      // 2. Direct G2UP Cyborg Pipeline check if active
      try {
        const cyborgStatus = cyborgPipelineService.getStatus();
        if (cyborgStatus.step1_login.success) {
          const scanRes = await cyborgPipelineService.executeStep2Scan();
          if (scanRes.success && Array.isArray(scanRes.products)) {
            const outOfStockG2up = scanRes.products.filter(p => (p.stock || 0) <= 0).length;
            outOfStockDetected += outOfStockG2up;
            totalProductsScanned += scanRes.products.length;
            detailParts.push(`Cyborg G2UP Direct: Quét ${scanRes.products.length} sp, ${outOfStockG2up} hết hàng`);
          }
        }
      } catch (cyErr: any) {
        // Ignore optional cyborg error
      }

      this.totalOutOfStockFound = outOfStockDetected;
      const durationMs = Date.now() - t0;

      const logEntry: CronLogItem = {
        id: `cron_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        trigger,
        durationMs,
        suppliersChecked,
        totalProductsScanned,
        totalStockUpdated,
        outOfStockDetected,
        status: 'SUCCESS',
        details: detailParts.join(' | ') || 'Hoàn tất quét định kỳ, kho hàng đã đồng bộ'
      };

      this.logs.unshift(logEntry);
      if (this.logs.length > 50) this.logs.pop();

      console.log(`✅ [CronService] Tick completed in ${durationMs}ms: Checked ${suppliersChecked} suppliers, ${totalProductsScanned} products, ${outOfStockDetected} out of stock.`);

      return {
        success: true,
        durationMs,
        suppliersChecked,
        totalProductsScanned,
        totalStockUpdated,
        outOfStockDetected,
        message: `Đồng bộ hoàn tất trong ${durationMs}ms. ${detailParts.join(' | ')}`
      };
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      const errorEntry: CronLogItem = {
        id: `cron_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        trigger,
        durationMs,
        suppliersChecked,
        totalProductsScanned,
        totalStockUpdated,
        outOfStockDetected,
        status: 'ERROR',
        details: `Lỗi thực thi Cron: ${err.message}`
      };
      this.logs.unshift(errorEntry);
      if (this.logs.length > 50) this.logs.pop();

      console.error('[CronService] Error in cron tick:', err);
      return {
        success: false,
        durationMs,
        suppliersChecked,
        totalProductsScanned,
        totalStockUpdated,
        outOfStockDetected,
        message: `Lỗi thực thi Cron: ${err.message}`
      };
    } finally {
      this.isExecuting = false;
    }
  }

  public static getStatus(): CronStatus {
    return {
      isActive: this.config.enabled,
      isExecuting: this.isExecuting,
      config: { ...this.config },
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      totalRuns: this.totalRuns,
      totalOutOfStockFound: this.totalOutOfStockFound,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      recentLogs: this.logs.slice(0, 20)
    };
  }
}
