// ==============================================================================
// CYBERPOOL: SOURCE CONNECTOR & SCAN ENGINE API ROUTES
// ==============================================================================
import { Router } from 'express';
import { sourceConnectorService } from '../../../services/sourceConnector/sourceConnectorService';
import { BUILT_IN_SCANNER_PROFILES } from '../../../services/sourceConnector/scannerProfile';
import { categoryMapper } from '../../../services/sourceConnector/categoryMapper';

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
