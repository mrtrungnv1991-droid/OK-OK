// ==============================================================================
// CYBERPOOL: RELIABLE ORDER PROCESSING & RECOVERY API ROUTES
// ==============================================================================

import { Router } from 'express';
import crypto from 'crypto';
import { orderProcessingService } from '../../../services/orderProcessing/orderProcessingService';
import { orderLock } from '../../../services/orderProcessing/distributedLock';
import { sourceCircuitBreaker } from '../../../services/orderProcessing/circuitBreaker';
import { keyVault } from '../../../services/orderProcessing/keyVaultService';
import { notificationQueue } from '../../../services/orderProcessing/notificationQueueService';
import { reconciliationWorker } from '../../../services/orderProcessing/reconciliationWorker';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';

export const reliableOrderRouter = Router();

// 1. Get orders list with status filter (Admin only)
reliableOrderRouter.get('/', requireAuth, requireRole('ADMIN'), (req, res) => {
  const status = req.query.status as string;
  const orders = orderProcessingService.getOrders(status);
  res.json({ success: true, data: orders });
});

// 2. Get Reliability Metrics & KPIs (Admin only)
reliableOrderRouter.get('/metrics', requireAuth, requireRole('ADMIN'), (req, res) => {
  const metrics = orderProcessingService.getReliabilityMetrics();
  res.json({ success: true, data: metrics });
});

// 3. Get Circuit Breakers statuses (Admin only)
reliableOrderRouter.get('/circuit-breakers', requireAuth, requireRole('ADMIN'), (req, res) => {
  const statuses = sourceCircuitBreaker.getAllStatuses();
  res.json({ success: true, data: statuses });
});

// Reset Circuit Breaker (Admin only)
reliableOrderRouter.post('/circuit-breakers/reset', requireAuth, requireRole('ADMIN'), (req, res) => {
  const { provider } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'Thiếu provider' });
  sourceCircuitBreaker.reset(provider);
  res.json({ success: true, message: `Đã reset Circuit Breaker cho ${provider}` });
});

// Trip Circuit Breaker for testing (Admin only)
reliableOrderRouter.post('/circuit-breakers/trip', requireAuth, requireRole('ADMIN'), (req, res) => {
  const { provider } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'Thiếu provider' });
  sourceCircuitBreaker.trip(provider);
  res.json({ success: true, message: `Đã kích hoạt Circuit Breaker MỞ (OPEN) cho ${provider}` });
});

// 4. Get Active Distributed Locks (Admin only)
reliableOrderRouter.get('/locks', requireAuth, requireRole('ADMIN'), (req, res) => {
  const locks = orderLock.getActiveLocks();
  res.json({ success: true, data: locks });
});

// 5. Get Notification Queue & DLQ (Admin only)
reliableOrderRouter.get('/notifications', requireAuth, requireRole('ADMIN'), (req, res) => {
  const filter = req.query.filter as 'ALL' | 'DLQ' | 'ACTIVE';
  const queue = notificationQueue.getQueue(filter || 'ALL');
  const dlqAlerts = notificationQueue.getDLQAlerts();
  res.json({ success: true, data: { queue, dlqAlerts } });
});

// Retry DLQ Notification (Admin only)
reliableOrderRouter.post('/notifications/:id/retry', requireAuth, requireRole('ADMIN'), (req, res) => {
  const success = notificationQueue.retryDLQ(req.params.id);
  res.json({ success, message: success ? 'Đã kích hoạt thử lại thông báo từ DLQ' : 'Không tìm thấy thông báo trong DLQ' });
});

// 6. Create and process a reliable order (Authenticated)
reliableOrderRouter.post('/create', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = {
      ...req.body,
      buyer_id: req.user!.id,
      buyer_email: req.user!.email
    };
    const result = await orderProcessingService.createAndProcessOrder(payload);
    res.json({ success: true, data: result.order, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Confirm source account topped up & resume purchase (Admin only)
reliableOrderRouter.post('/:id/confirm-balance', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const operatorId = req.user!.id || 'admin-operator';
  const result = await orderProcessingService.confirmBalanceAndResume(req.params.id, operatorId);
  res.json(result);
});

// 8. Single order reconciliation (Admin only)
reliableOrderRouter.post('/:id/reconcile', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const operatorId = req.user!.id || 'admin-reconciler';
  const result = await orderProcessingService.retryReconciliationManual(req.params.id, operatorId);
  res.json(result);
});

// 9. Reconcile all unknown orders (Admin only)
reliableOrderRouter.post('/reconcile-all', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const unknownOrders = orderProcessingService.getOrders().filter(
    o => o.status === 'PURCHASE_UNKNOWN' || o.status === 'PURCHASE_RECONCILING'
  );

  const results: any[] = [];
  for (const ord of unknownOrders) {
    const r = await reconciliationWorker.reconcileSingleOrder(
      ord,
      (o, evt, meta) => orderProcessingService.recordEvent(o.id, evt as any, 'WORKER', 'reconcile-all-cron', meta),
      async (o) => {
        await orderProcessingService.executeDelivery(o.id);
      }
    );
    results.push(r);
  }

  res.json({
    success: true,
    total_scanned: unknownOrders.length,
    results,
    message: `Đã hoàn tất đối soát ${unknownOrders.length} đơn hàng chưa xác định.`
  });
});

// 9b. Auto Fix single order (Admin only)
reliableOrderRouter.post('/:id/auto-fix', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const operatorId = req.user!.id || 'admin-autofix';
  const result = await orderProcessingService.autoFixOrder(req.params.id, operatorId);
  res.json(result);
});

// 9c. Auto Fix all problematic orders (Admin only)
reliableOrderRouter.post('/fix-all', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const operatorId = req.user!.id || 'admin-autofix';
  const result = await orderProcessingService.autoFixAll(operatorId);
  res.json(result);
});

// 10. Manual Recovery Actions (Admin only)
reliableOrderRouter.post('/:id/manual-action', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { action, raw_key, reason } = req.body;
  const orderId = req.params.id;
  const operator = req.user!.id || 'admin-recovery';

  if (action === 'CHECK_SOURCE_ORDER') {
    const r = orderProcessingService.checkSourceOrder(orderId);
    return res.json({ success: true, ...r });
  }

  if (action === 'RETRY_RECONCILIATION') {
    const r = await orderProcessingService.retryReconciliationManual(orderId, operator);
    return res.json(r);
  }

  if (action === 'RETRY_PURCHASE') {
    const r = await orderProcessingService.retryPurchaseManual(orderId, operator);
    return res.json(r);
  }

  if (action === 'MARK_PURCHASED') {
    const r = orderProcessingService.markPurchasedManual(orderId, raw_key, operator);
    return res.json(r);
  }

  if (action === 'MANUAL_COMPLETE') {
    const r = orderProcessingService.manualComplete(orderId, operator);
    return res.json(r);
  }

  if (action === 'REFUND') {
    const r = orderProcessingService.refundOrder(orderId, reason, operator);
    return res.json(r);
  }

  res.status(400).json({ success: false, error: 'Hành động can thiệp thủ công không hợp lệ' });
});

// 11. Get Order Events (Append-only Audit Trail - Authenticated)
reliableOrderRouter.get('/:id/events', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = req.params.id;
  const order = orderProcessingService.getOrders().find(o => o.id === orderId);
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  if (!isAdmin && order && order.customer_id !== req.user!.id) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const events = orderProcessingService.getOrderEvents(orderId);
  res.json({ success: true, data: events });
});

// 12. Get Purchase Attempts (Admin only)
reliableOrderRouter.get('/:id/attempts', requireAuth, requireRole('ADMIN'), (req, res) => {
  const attempts = orderProcessingService.getPurchaseAttempts(req.params.id);
  res.json({ success: true, data: attempts });
});

// 13. Get Decrypted Key from Key Vault (Audited & Authorized)
reliableOrderRouter.get('/:id/key', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = req.params.id;
  const actorId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  const order = orderProcessingService.getOrders().find(o => o.id === orderId);
  if (!isAdmin && (!order || order.customer_id !== req.user!.id)) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập khóa đơn hàng này' });
  }

  const vaultRec = keyVault.getVaultRecord(orderId);
  if (!vaultRec) {
    return res.status(404).json({ success: false, error: 'Chưa có khóa bản quyền trong Key Vault' });
  }

  try {
    const decrypted = keyVault.decryptKey(vaultRec.encrypted_key, actorId, orderId, vaultRec.id);
    const integrityValid = keyVault.verifyIntegrity(orderId, decrypted);

    res.json({
      success: true,
      data: {
        vault_id: vaultRec.id,
        order_id: vaultRec.order_id,
        provider: vaultRec.provider,
        source_transaction_id: vaultRec.source_transaction_id,
        status: vaultRec.status,
        decrypted_key: decrypted,
        integrity_valid: integrityValid,
        created_at: vaultRec.created_at,
        delivered_at: vaultRec.delivered_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Key Vault records list & access logs (Admin only)
reliableOrderRouter.get('/vault/overview', requireAuth, requireRole('ADMIN'), (req, res) => {
  const records = keyVault.getAllRecords();
  const logs = keyVault.getAccessLogs();
  res.json({
    success: true,
    data: {
      records_count: records.length,
      records: records.map(r => ({
        id: r.id,
        order_id: r.order_id,
        provider: r.provider,
        source_transaction_id: r.source_transaction_id,
        status: r.status,
        key_hash_preview: r.key_hash.substring(0, 16) + '...',
        created_at: r.created_at,
        delivered_at: r.delivered_at
      })),
      access_logs: logs
    }
  });
});

// 15. Telegram Action Callback Webhook
// CYBERPOOL SECURITY FIX (CRITICAL): trước đây endpoint này KHÔNG auth, không
// chữ ký — bất kỳ ai cũng POST {order_id, action:'CONFIRM_FUNDS'} để resume/
// xác nhận giải ngân đơn hàng. Giờ yêu cầu HMAC-SHA256 shared secret
// (TELEGRAM_CALLBACK_SECRET) trên header X-Telegram-Signature; thiếu secret
// trong env = từ chối (fail-closed, mọi env).
reliableOrderRouter.post('/telegram/callback', async (req, res) => {
  const secret = process.env.TELEGRAM_CALLBACK_SECRET;
  if (!secret) {
    return res.status(503).json({
      success: false,
      message: 'TELEGRAM_CALLBACK_SECRET chưa được cấu hình — callback bị từ chối (fail-closed).'
    });
  }

  const signature = String(req.header('X-Telegram-Signature') || '');
  if (!signature) {
    return res.status(401).json({ success: false, message: 'Thiếu chữ ký X-Telegram-Signature.' });
  }

  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body || {})).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return res.status(401).json({ success: false, message: 'Chữ ký Telegram callback không hợp lệ.' });
  }

  const result = await orderProcessingService.handleTelegramAction(req.body);
  res.json(result);
});

// 16. Dual Stream Support Chat (Authenticated)
reliableOrderRouter.get('/:id/chat', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = req.params.id;
  const order = orderProcessingService.getOrders().find(o => o.id === orderId);
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  if (!isAdmin && order && order.customer_id !== req.user!.id) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const msgs = orderProcessingService.getDualChatMessages(orderId);
  res.json({ success: true, data: msgs });
});

reliableOrderRouter.post('/:id/chat', requireAuth, (req: AuthenticatedRequest, res) => {
  const orderId = req.params.id;
  const order = orderProcessingService.getOrders().find(o => o.id === orderId);
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  if (!isAdmin && order && order.customer_id !== req.user!.id) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const msg = orderProcessingService.sendDualChatMessage({
    order_id: orderId,
    stream: req.body.stream,
    sender: isAdmin ? 'ADMIN' : 'CUSTOMER',
    sender_name: req.user!.name || 'Khách hàng',
    content: req.body.content,
    is_forwarded: req.body.is_forwarded
  });
  res.json({ success: true, data: msg });
});

// 17. Run Failure Scenario Simulations (Admin only - Strictly disabled in production)
reliableOrderRouter.post('/simulate-scenario', requireAuth, requireRole('ADMIN'), async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Simulation is disabled in production environment.' });
  }

  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ success: false, error: 'Thiếu mã kịch bản' });

  try {
    const report = await orderProcessingService.runFailureScenario(scenario);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
