// ==============================================================================
// CYBERPOOL: SOURCE CONNECTOR & SCAN ENGINE API ROUTES
// ==============================================================================
import { Router } from 'express';
import { sourceConnectorService } from '../../../services/sourceConnector/sourceConnectorService';
import { BUILT_IN_SCANNER_PROFILES } from '../../../services/sourceConnector/scannerProfile';
import { categoryMapper } from '../../../services/sourceConnector/categoryMapper';
import { cyborgPipelineService } from '../../../services/sourceConnector/cyborgPipelineService';

export const sourceConnectorRouter = Router();

// 1. Get Accounts
sourceConnectorRouter.get('/accounts', (req, res) => {
  try {
    const accounts = sourceConnectorService.getAccounts();
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 2. Create Account
sourceConnectorRouter.post('/accounts', (req, res) => {
  try {
    const created = sourceConnectorService.createAccount(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 3. Update Account
sourceConnectorRouter.put('/accounts/:id', (req, res) => {
  try {
    const updated = sourceConnectorService.updateAccount(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 4. Test Login
sourceConnectorRouter.post('/accounts/:id/test-login', async (req, res) => {
  try {
    const result = await sourceConnectorService.testLogin(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 5. Pause / Resume Account
sourceConnectorRouter.post('/accounts/:id/pause', (req, res) => {
  const updated = sourceConnectorService.updateAccount(req.params.id, { is_active: false, status: 'DISABLED' });
  res.json({ success: true, data: updated });
});

sourceConnectorRouter.post('/accounts/:id/resume', (req, res) => {
  const updated = sourceConnectorService.updateAccount(req.params.id, { is_active: true, status: 'ONLINE' });
  res.json({ success: true, data: updated });
});

// 6. Trigger Full Scan (Idempotent)
sourceConnectorRouter.post('/scan/full', (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId is required' });
    }

    const { job, isAlreadyRunning } = sourceConnectorService.triggerScan(accountId, 'FULL');
    if (isAlreadyRunning) {
      return res.status(409).json({
        success: false,
        message: 'A scan job is already running for this account',
        data: job
      });
    }

    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 7. Trigger Incremental Scan
sourceConnectorRouter.post('/scan/incremental', (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, message: 'accountId is required' });
    }

    const { job, isAlreadyRunning } = sourceConnectorService.triggerScan(accountId, 'INCREMENTAL');
    if (isAlreadyRunning) {
      return res.status(409).json({
        success: false,
        message: 'A scan job is already running for this account',
        data: job
      });
    }

    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// 8. Get Scan Jobs
sourceConnectorRouter.get('/scan/jobs', (req, res) => {
  res.json({ success: true, data: sourceConnectorService.getScanJobs() });
});

sourceConnectorRouter.get('/scan/jobs/:id', (req, res) => {
  const job = sourceConnectorService.getScanJobById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }
  res.json({ success: true, data: job });
});

// 9. Get Products
sourceConnectorRouter.get('/products', (req, res) => {
  const { accountId, search, status } = req.query;
  const list = sourceConnectorService.getProducts({
    accountId: accountId as string,
    search: search as string,
    status: status as string
  });
  res.json({ success: true, data: list });
});

// 10. Update Product (Overrides, Ignore)
sourceConnectorRouter.patch('/products/:id', (req, res) => {
  const updated = sourceConnectorService.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: updated });
});

// 11. Bulk Actions
sourceConnectorRouter.post('/products/bulk', (req, res) => {
  const { productIds, action, payload } = req.body;
  if (!productIds || !Array.isArray(productIds) || !action) {
    return res.status(400).json({ success: false, message: 'Invalid bulk action parameters' });
  }

  const result = sourceConnectorService.executeBulkAction(productIds, action, payload);
  res.json({ success: true, data: result });
});

// 12. Block Product
sourceConnectorRouter.post('/products/block', (req, res) => {
  const { sourceAccountId, sourceProductId, reason } = req.body;
  sourceConnectorService.blockProduct(sourceAccountId, sourceProductId, reason || 'Blocked by Admin');
  res.json({ success: true, message: 'Product added to blocklist' });
});

// 13. Get Offers & Best Route Simulator
sourceConnectorRouter.get('/offers', (req, res) => {
  res.json({ success: true, data: sourceConnectorService.getOffers() });
});

sourceConnectorRouter.post('/offers/best-route', (req, res) => {
  const { internalProductId, quantity } = req.body;
  const result = sourceConnectorService.routeBestSource(internalProductId, Number(quantity) || 1);
  res.json({ success: true, data: result });
});

// 14. Categories
sourceConnectorRouter.get('/categories', (req, res) => {
  res.json({ success: true, data: categoryMapper.getAllMappings() });
});

sourceConnectorRouter.post('/categories/map', (req, res) => {
  categoryMapper.setMapping(req.body);
  res.json({ success: true, message: 'Mapping updated successfully' });
});

// 15. Scanner Profiles
sourceConnectorRouter.get('/profiles', (req, res) => {
  res.json({ success: true, data: Object.values(BUILT_IN_SCANNER_PROFILES) });
});

// 16. Audit Logs
sourceConnectorRouter.get('/audit-logs', (req, res) => {
  res.json({ success: true, data: sourceConnectorService.getAuditLogs() });
});

// ==============================================================================
// 17. CYBORG // G2UP.NET 4-STEP DIRECT API PIPELINE ROUTES
// ==============================================================================

// Get current pipeline status
sourceConnectorRouter.get('/cyborg/status', (req, res) => {
  try {
    const status = cyborgPipelineService.getStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Step 1: Login Cyborg account (Verify session, API key & fetch live balance)
sourceConnectorRouter.post('/cyborg/login', async (req, res) => {
  try {
    const result = await cyborgPipelineService.executeStep1Login();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Step 2: Scan live products & categories from G2UP.NET API
sourceConnectorRouter.post('/cyborg/scan', async (req, res) => {
  try {
    const result = await cyborgPipelineService.executeStep2Scan();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Step 3: Update & view Cyborg pricing configuration
sourceConnectorRouter.post('/cyborg/pricing-config', (req, res) => {
  try {
    const updated = cyborgPipelineService.updatePricingConfig(req.body);
    res.json({ success: true, data: updated, status: cyborgPipelineService.getStatus() });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Step 4: Publish/Post scanned G2UP products directly to Storefront (db.products)
sourceConnectorRouter.post('/cyborg/publish', async (req, res) => {
  try {
    const { publishAllOrInStock, includeZeroStockSamples } = req.body || {};
    const result = await cyborgPipelineService.executeStep4Publish({
      publishAllOrInStock,
      includeZeroStockSamples
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Full 1-Click Pipeline Execution (Login -> Scan -> Pricing Formula -> Post to Web)
sourceConnectorRouter.post('/cyborg/run-full-pipeline', async (req, res) => {
  try {
    const result = await cyborgPipelineService.runFullPipeline();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Auto-Classify All Products by Keywords (Account, Server, Key, Topup...)
sourceConnectorRouter.post('/cyborg/auto-classify', (req, res) => {
  try {
    const result = cyborgPipelineService.autoClassifyAllProducts();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Manual/Batch Update Classification for a product
sourceConnectorRouter.post('/cyborg/update-classification', (req, res) => {
  try {
    const { productId, category, salesType, allowGroupBuy } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Thiếu productId' });
    }
    const result = cyborgPipelineService.updateProductClassification(productId, {
      category,
      salesType,
      allowGroupBuy
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

// Safety Settings for Live Source Buy API
sourceConnectorRouter.get('/cyborg/safety-settings', (req, res) => {
  try {
    const result = cyborgPipelineService.getSafetySettings();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});

sourceConnectorRouter.post('/cyborg/safety-settings', (req, res) => {
  try {
    const { liveBuyEnabled } = req.body;
    const result = cyborgPipelineService.setSafetySettings(Boolean(liveBuyEnabled));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
});


