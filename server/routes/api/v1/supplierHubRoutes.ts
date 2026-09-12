import { Router } from 'express';
import { SupplierManagerService } from '../../../services/supplierHub/services/SupplierManagerService';
import { PRESET_ADAPTERS } from '../../../services/supplierHub/core/ProviderAdapterConfig';
import { db } from '../../../db/store';
import { detectDeliveryBranch, BRANCH_CONFIGS, DeliveryBranch } from '../../../services/supplierHub/utils/deliveryBranchDetector';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';

export const supplierHubRouter = Router();

// CYBERPOOL SECURITY FIX: the entire supplier-hub surface (create/delete
// suppliers, sync, mappings, diagnostics) mutates the supply chain. It must be
// ADMIN-only. Previously mounted with zero authentication — any anonymous user
// could create/delete suppliers and trigger syncs.
supplierHubRouter.use(requireAuth, requireRole('ADMIN'));

// 1. Get all suppliers
supplierHubRouter.get('/suppliers', (req, res) => {
  try {
    const suppliers = SupplierManagerService.getAllSuppliers();
    res.json({ success: true, data: suppliers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Create supplier (Account / API / Custom)
supplierHubRouter.post('/suppliers', (req, res) => {
  try {
    const result = SupplierManagerService.createSupplier(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result.supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Get single supplier
supplierHubRouter.get('/suppliers/:id', (req, res) => {
  try {
    const supplier = SupplierManagerService.getSupplier(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Update supplier
supplierHubRouter.put('/suppliers/:id', (req, res) => {
  try {
    const ok = SupplierManagerService.updateSupplier(req.params.id, req.body);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier updated successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Delete supplier
supplierHubRouter.delete('/suppliers/:id', (req, res) => {
  try {
    const ok = SupplierManagerService.deleteSupplier(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Test connection with real network diagnostics
supplierHubRouter.post('/suppliers/:id/test-connection', async (req, res) => {
  try {
    const result = await SupplierManagerService.testConnection(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Refresh real balance
supplierHubRouter.post('/suppliers/:id/refresh-balance', async (req, res) => {
  try {
    const result = await SupplierManagerService.refreshBalance(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Run Product Sync Job
supplierHubRouter.post('/suppliers/:id/sync-products', async (req, res) => {
  try {
    const mode = req.body?.mode || 'FULL';
    const result = await SupplierManagerService.runProductSync(req.params.id, mode);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Get Sync Jobs for a supplier
supplierHubRouter.get('/suppliers/:id/sync-jobs', (req, res) => {
  try {
    const jobs = SupplierManagerService.getSyncJobs(req.params.id);
    res.json({ success: true, data: jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Get Single Sync Job
supplierHubRouter.get('/sync-jobs/:jobId', (req, res) => {
  try {
    const job = SupplierManagerService.getSyncJobById(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Sync job not found' });
    res.json({ success: true, data: job });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Get Product Mappings for a supplier (enriched with local product info)
supplierHubRouter.get('/suppliers/:id/mappings', (req, res) => {
  try {
    const mappings = SupplierManagerService.getSupplierMappings(req.params.id);
    const enriched = mappings.map(m => {
      const local = db.products.find(p => p.id === m.localProductId);
      const branch: DeliveryBranch = m.deliveryBranch || local?.deliveryBranch || detectDeliveryBranch({ title: local?.title, category: m.supplierCategoryId });
      const cfg = BRANCH_CONFIGS[branch];
      return {
        ...m,
        deliveryBranch: branch,
        outputFormat: m.outputFormat || local?.outputFormat || cfg.outputFormat,
        outputTemplate: m.outputTemplate || local?.outputTemplate || cfg.outputTemplate,
        localTitle: local?.title || 'Chưa gắn tên',
        localCategory: local?.category,
        stockAvailable: local?.stockAvailable ?? 0,
        images: local?.images || [],
        localPrice: local?.retailPrice ?? m.finalSellingPrice
      };
    });
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Get ALL Product Mappings across suppliers
supplierHubRouter.get('/mappings', (req, res) => {
  try {
    const mappings = SupplierManagerService.getAllMappings();
    const enriched = mappings.map(m => {
      const local = db.products.find(p => p.id === m.localProductId);
      const branch: DeliveryBranch = m.deliveryBranch || local?.deliveryBranch || detectDeliveryBranch({ title: local?.title, category: m.supplierCategoryId });
      const cfg = BRANCH_CONFIGS[branch];
      return {
        ...m,
        deliveryBranch: branch,
        outputFormat: m.outputFormat || local?.outputFormat || cfg.outputFormat,
        outputTemplate: m.outputTemplate || local?.outputTemplate || cfg.outputTemplate,
        localTitle: local?.title || 'Chưa gắn tên',
        localCategory: local?.category,
        stockAvailable: local?.stockAvailable ?? 0,
        images: local?.images || [],
        localPrice: local?.retailPrice ?? m.finalSellingPrice
      };
    });
    res.json({ success: true, data: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 13. Update Product Mapping (e.g. manual price override)
supplierHubRouter.put('/mappings/:id', (req, res) => {
  try {
    const ok = SupplierManagerService.updateProductMapping(req.params.id, req.body);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 14. Get Supplier Orders Ledger
supplierHubRouter.get('/orders', (req, res) => {
  try {
    const orders = SupplierManagerService.getSupplierOrders();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 15. Dashboard Aggregate Stats
supplierHubRouter.get('/stats', (req, res) => {
  try {
    const suppliers = SupplierManagerService.getAllSuppliers();
    const orders = SupplierManagerService.getSupplierOrders();
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;

    for (const sup of suppliers) {
      totalRevenue += sup.stats.totalRevenue;
      totalCost += sup.stats.totalCost;
      totalProfit += sup.stats.totalProfit;
    }

    res.json({
      success: true,
      data: {
        totalSuppliers: suppliers.length,
        connectedSuppliers: suppliers.filter(s => s.connectionStatus === 'CONNECTED').length,
        accountSuppliers: suppliers.filter(s => s.connectionType === 'ACCOUNT').length,
        apiSuppliers: suppliers.filter(s => s.connectionType === 'API').length,
        customSuppliers: suppliers.filter(s => s.connectionType === 'CUSTOM').length,
        totalOrders: orders.length,
        totalRevenue,
        totalCost,
        totalProfit
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 16. Get Preset Adapter Configurations
supplierHubRouter.get('/presets', (req, res) => {
  res.json({ success: true, data: PRESET_ADAPTERS });
});

// 17. Real Database Verification Endpoint (Requirement #18: Verify DB counts)
supplierHubRouter.get('/diagnostics/database', (req, res) => {
  try {
    const mappings = SupplierManagerService.getAllMappings();
    const syncedLocalProducts = db.products.filter(p => p.tags?.includes('SOURCE_SYNCED') || p.source_info);
    
    res.json({
      success: true,
      data: {
        totalProductMappingsInStore: mappings.length,
        totalSyncedProductsInLocalCatalog: syncedLocalProducts.length,
        totalCatalogProductsCount: db.products.length,
        totalCategoriesCount: db.categories.length,
        databaseType: 'File-Backed Persistent Store (server/data/supplier_hub/)',
        isPersistent: true,
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});
