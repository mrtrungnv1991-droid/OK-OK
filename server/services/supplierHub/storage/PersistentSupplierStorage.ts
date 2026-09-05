import fs from 'fs';
import path from 'path';
import { 
  SupplierModel, 
  SupplierCredentials, 
  ProductMappingModel, 
  CategoryMappingModel, 
  SupplierOrderSnapshot, 
  SyncJobModel 
} from '../types';
import { db } from '../../../db/store';

const STORAGE_DIR = path.join(process.cwd(), 'server', 'data', 'supplier_hub');

export class PersistentSupplierStorage {
  private static isInitialized = false;

  public static ensureDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private static getFilePath(filename: string): string {
    this.ensureDir();
    return path.join(STORAGE_DIR, filename);
  }

  private static safeReadJson<T>(filename: string, fallback: T): T {
    try {
      const p = this.getFilePath(filename);
      if (!fs.existsSync(p)) return fallback;
      const raw = fs.readFileSync(p, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[PersistentStorage] Warning reading ${filename}:`, err);
      return fallback;
    }
  }

  private static safeWriteJson(filename: string, data: any): void {
    try {
      this.ensureDir();
      const p = this.getFilePath(filename);
      const tempPath = `${p}.tmp_${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, p);
    } catch (err) {
      console.error(`[PersistentStorage] Error writing ${filename}:`, err);
    }
  }

  // --- Suppliers ---
  public static loadSuppliers(): Map<string, SupplierModel> {
    const list = this.safeReadJson<SupplierModel[]>('suppliers.json', []);
    const map = new Map<string, SupplierModel>();
    for (const item of list) {
      map.set(item.id, item);
    }
    return map;
  }

  public static saveSuppliers(suppliers: Map<string, SupplierModel>): void {
    this.safeWriteJson('suppliers.json', Array.from(suppliers.values()));
  }

  // --- Credentials ---
  public static loadCredentials(): Map<string, SupplierCredentials> {
    const list = this.safeReadJson<Array<{ id: string; creds: SupplierCredentials }>>('credentials.json', []);
    const map = new Map<string, SupplierCredentials>();
    for (const item of list) {
      map.set(item.id, item.creds);
    }
    return map;
  }

  public static saveCredentials(credentials: Map<string, SupplierCredentials>): void {
    const list = Array.from(credentials.entries()).map(([id, creds]) => ({ id, creds }));
    this.safeWriteJson('credentials.json', list);
  }

  // --- Product Mappings ---
  public static loadProductMappings(): Map<string, ProductMappingModel> {
    const list = this.safeReadJson<ProductMappingModel[]>('product_mappings.json', []);
    const map = new Map<string, ProductMappingModel>();
    for (const item of list) {
      map.set(`${item.supplierId}_${item.supplierProductId}`, item);
    }
    return map;
  }

  public static saveProductMappings(mappings: Map<string, ProductMappingModel>): void {
    this.safeWriteJson('product_mappings.json', Array.from(mappings.values()));
  }

  // --- Category Mappings ---
  public static loadCategoryMappings(): Map<string, CategoryMappingModel> {
    const list = this.safeReadJson<CategoryMappingModel[]>('category_mappings.json', []);
    const map = new Map<string, CategoryMappingModel>();
    for (const item of list) {
      map.set(item.id, item);
    }
    return map;
  }

  public static saveCategoryMappings(categoryMappings: Map<string, CategoryMappingModel>): void {
    this.safeWriteJson('category_mappings.json', Array.from(categoryMappings.values()));
  }

  // --- Sync Jobs ---
  public static loadSyncJobs(): Map<string, SyncJobModel> {
    const list = this.safeReadJson<SyncJobModel[]>('sync_jobs.json', []);
    const map = new Map<string, SyncJobModel>();
    for (const item of list) {
      map.set(item.id, item);
    }
    return map;
  }

  public static saveSyncJobs(syncJobs: Map<string, SyncJobModel>): void {
    this.safeWriteJson('sync_jobs.json', Array.from(syncJobs.values()));
  }

  // --- Supplier Orders ---
  public static loadSupplierOrders(): Map<string, SupplierOrderSnapshot> {
    const list = this.safeReadJson<SupplierOrderSnapshot[]>('supplier_orders.json', []);
    const map = new Map<string, SupplierOrderSnapshot>();
    for (const item of list) {
      map.set(item.id, item);
    }
    return map;
  }

  public static saveSupplierOrders(orders: Map<string, SupplierOrderSnapshot>): void {
    this.safeWriteJson('supplier_orders.json', Array.from(orders.values()));
  }

  // --- Persist Synced Local Products into db.products ---
  public static restoreSyncedLocalProducts(): void {
    const list = this.safeReadJson<any[]>('synced_local_products.json', []);
    let modified = false;
    for (const p of list) {
      if (!p.seller) {
        p.seller = {
          id: p.source_info?.supplierId || 'seller-supplier-direct',
          name: p.source_info?.supplierName || 'Verified Supplier',
          avatar: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=150&q=80',
          badge: 'Supplier Direct',
          rating: 4.95,
          totalDeals: 1500,
          completedPools: 850,
          responseTime: '< 1 phút'
        };
        modified = true;
      }
      if (!p.groupPrice && p.retailPrice) {
        p.groupPrice = Math.round(p.retailPrice * 0.85);
        modified = true;
      }
      if (!p.bannerImg && p.images && p.images.length > 0) {
        p.bannerImg = p.images[0];
        modified = true;
      }
      const idx = db.products.findIndex(existing => existing.id === p.id);
      if (idx >= 0) {
        db.products[idx] = { ...db.products[idx], ...p };
      } else {
        db.products.push(p);
      }
    }
    if (modified) {
      this.persistSyncedLocalProducts();
    }
  }

  public static persistSyncedLocalProducts(): void {
    // Collect all products with tag SOURCE_SYNCED
    const synced = db.products.filter(p => p.tags?.includes('SOURCE_SYNCED') || p.source_info);
    this.safeWriteJson('synced_local_products.json', synced);
  }
}
