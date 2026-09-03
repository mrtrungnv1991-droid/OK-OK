// ==============================================================================
// CYBERPOOL: RELIABLE ORDER PROCESSING & RECOVERY API ROUTES
// ==============================================================================

import { Router } from 'express';
import { orderProcessingService } from '../../../services/orderProcessing/orderProcessingService';
import { orderLock } from '../../../services/orderProcessing/distributedLock';
import { sourceCircuitBreaker } from '../../../services/orderProcessing/circuitBreaker';
import { keyVault } from '../../../services/orderProcessing/keyVaultService';
import { notificationQueue } from '../../../services/orderProcessing/notificationQueueService';
import { reconciliationWorker } from '../../../services/orderProcessing/reconciliationWorker';

export const reliableOrderRouter = Router();

// 1. Get orders list with status filter
reliableOrderRouter.get('/', (req, res) => {
  const status = req.query.status as string;
  const orders = orderProcessingService.getOrders(status);
  res.json({ success: true, data: orders });
});

// 2. Get Reliability Metrics & KPIs
reliableOrderRouter.get('/metrics', (req, res) => {
  const metrics = orderProcessingService.getReliabilityMetrics();
  res.json({ success: true, data: metrics });
});

// 3. Get Circuit Breakers statuses
reliableOrderRouter.get('/circuit-breakers', (req, res) => {
  const statuses = sourceCircuitBreaker.getAllStatuses();
  res.json({ success: true, data: statuses });
});

// Reset Circuit Breaker
reliableOrderRouter.post('/circuit-breakers/reset', (req, res) => {
  const { provider } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'Thiếu provider' });
  sourceCircuitBreaker.reset(provider);
  res.json({ success: true, message: `Đã reset Circuit Breaker cho ${provider}` });
});

// Trip Circuit Breaker for testing
reliableOrderRouter.post('/circuit-breakers/trip', (req, res) => {
  const { provider } = req.body;
  if (!provider) return res.status(400).json({ success: false, error: 'Thiếu provider' });
  sourceCircuitBreaker.trip(provider);
  res.json({ success: true, message: `Đã kích hoạt Circuit Breaker MỞ (OPEN) cho ${provider}` });
});

// 4. Get Active Distributed Locks
reliableOrderRouter.get('/locks', (req, res) => {
  const locks = orderLock.getActiveLocks();
  res.json({ success: true, data: locks });
});

// 5. Get Notification Queue & DLQ
reliableOrderRouter.get('/notifications', (req, res) => {
  const filter = req.query.filter as 'ALL' | 'DLQ' | 'ACTIVE';
  const queue = notificationQueue.getQueue(filter || 'ALL');
  const dlqAlerts = notificationQueue.getDLQAlerts();
  res.json({ success: true, data: { queue, dlqAlerts } });
});

// Retry DLQ Notification
reliableOrderRouter.post('/notifications/:id/retry', (req, res) => {
  const success = notificationQueue.retryDLQ(req.params.id);
  res.json({ success, message: success ? 'Đã kích hoạt thử lại thông báo từ DLQ' : 'Không tìm thấy thông báo trong DLQ' });
});

// 6. Create and process a reliable order
reliableOrderRouter.post('/create', async (req, res) => {
  try {
    const result = await orderProcessingService.createAndProcessOrder(req.body);
    res.json({ success: true, data: result.order, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Confirm source account topped up & resume purchase
reliableOrderRouter.post('/:id/confirm-balance', async (req, res) => {
  const operatorId = (req.body.operator_id as string) || 'admin-operator';
  const result = await orderProcessingService.confirmBalanceAndResume(req.params.id, operatorId);
  res.json(result);
});

// 8. Single order reconciliation
reliableOrderRouter.post('/:id/reconcile', async (req, res) => {
  const operatorId = (req.body.operator_id as string) || 'admin-reconciler';
  const result = await orderProcessingService.retryReconciliationManual(req.params.id, operatorId);
  res.json(result);
});

// 9. Reconcile all unknown orders
reliableOrderRouter.post('/reconcile-all', async (req, res) => {
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

// 9b. Auto Fix single order
reliableOrderRouter.post('/:id/auto-fix', async (req, res) => {
  const operatorId = (req.body.operator_id as string) || 'admin-autofix';
  const result = await orderProcessingService.autoFixOrder(req.params.id, operatorId);
  res.json(result);
});

// 9c. Auto Fix all problematic orders
reliableOrderRouter.post('/fix-all', async (req, res) => {
  const operatorId = (req.body.operator_id as string) || 'admin-autofix';
  const result = await orderProcessingService.autoFixAll(operatorId);
  res.json(result);
});

// 10. Manual Recovery Actions
reliableOrderRouter.post('/:id/manual-action', async (req, res) => {
  const { action, raw_key, reason, operator_id } = req.body;
  const orderId = req.params.id;
  const operator = operator_id || 'admin-recovery';

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

// 11. Get Order Events (Append-only Audit Trail)
reliableOrderRouter.get('/:id/events', (req, res) => {
  const events = orderProcessingService.getOrderEvents(req.params.id);
  res.json({ success: true, data: events });
});

// 12. Get Purchase Attempts
reliableOrderRouter.get('/:id/attempts', (req, res) => {
  const attempts = orderProcessingService.getPurchaseAttempts(req.params.id);
  res.json({ success: true, data: attempts });
});

// 13. Get Decrypted Key from Key Vault (Audited)
reliableOrderRouter.get('/:id/key', (req, res) => {
  const orderId = req.params.id;
  const actorId = (req.query.actor_id as string) || 'admin-viewer';
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

// 14. Key Vault records list & access logs
reliableOrderRouter.get('/vault/overview', (req, res) => {
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
reliableOrderRouter.post('/telegram/callback', async (req, res) => {
  const result = await orderProcessingService.handleTelegramAction(req.body);
  res.json(result);
});

// 16. Dual Stream Support Chat
reliableOrderRouter.get('/:id/chat', (req, res) => {
  const msgs = orderProcessingService.getDualChatMessages(req.params.id);
  res.json({ success: true, data: msgs });
});

reliableOrderRouter.post('/:id/chat', (req, res) => {
  const msg = orderProcessingService.sendDualChatMessage({
    order_id: req.params.id,
    stream: req.body.stream,
    sender: req.body.sender,
    sender_name: req.body.sender_name,
    content: req.body.content,
    is_forwarded: req.body.is_forwarded
  });
  res.json({ success: true, data: msg });
});

// 17. Run Failure Scenario Simulations (Scenarios A through F)
reliableOrderRouter.post('/simulate-scenario', async (req, res) => {
  const { scenario } = req.body;
  if (!scenario) return res.status(400).json({ success: false, error: 'Thiếu mã kịch bản' });

  try {
    const report = await orderProcessingService.runFailureScenario(scenario);
    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
