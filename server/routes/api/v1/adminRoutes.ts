import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { AuditService } from '../../../services/auditService';
import { LedgerService } from '../../../services/ledgerService';
import { GatewayVerificationService } from '../../../services/gatewayVerificationService';

export const adminRouter = Router();

// Require minimum ADMIN role for all routes in this router
adminRouter.use(requireAuth, requireRole('ADMIN'));

// GET /api/v1/admin/dashboard - High-level metrics
adminRouter.get('/dashboard', (req: AuthenticatedRequest, res) => {
  const totalUsers = db.users.size;
  const totalOrders = db.orders.size;
  const totalTransactions = db.transactions.length;
  
  let totalRevenue = 0;
  for (const order of db.orders.values()) {
    totalRevenue += order.pricePaid;
  }

  let totalEscrowHeld = 0;
  for (const user of db.users.values()) {
    totalEscrowHeld += user.escrowLocked;
  }

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalOrders,
      totalTransactions,
      totalRevenue,
      totalEscrowHeld,
      activePoolsCount: db.escrowContracts.size,
      totalProducts: db.products.length,
      totalGames: db.games.length,
      systemStatus: 'HEALTHY_ONLINE'
    }
  });
});

// GET /api/v1/admin/audit-logs
adminRouter.get('/audit-logs', (req: AuthenticatedRequest, res) => {
  const limit = Number(req.query.limit) || 100;
  res.json({
    success: true,
    logs: AuditService.getLogs(limit)
  });
});

// GET /api/v1/admin/users
adminRouter.get('/users', (req: AuthenticatedRequest, res) => {
  const usersList = Array.from(db.users.values());
  res.json({
    success: true,
    users: usersList
  });
});

// PUT /api/v1/admin/users/:id/role
adminRouter.put('/users/:id/role', requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
  const targetUser = db.users.get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const oldRole = targetUser.role;
  targetUser.role = req.body.role;
  db.users.set(targetUser.id, targetUser);

  AuditService.log({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'ADMIN_UPDATE_USER_ROLE',
    resource: 'USER_ACCOUNT',
    resourceId: targetUser.id,
    oldValue: { role: oldRole },
    newValue: { role: targetUser.role },
    ipAddress: req.ip
  });

  res.json({
    success: true,
    user: targetUser
  });
});

// GET /api/v1/admin/system-config
adminRouter.get('/system-config', (req, res) => {
  res.json({
    success: true,
    config: db.systemConfig
  });
});

// PUT /api/v1/admin/system-config
adminRouter.put('/system-config', (req: AuthenticatedRequest, res) => {
  const oldConfig = { ...db.systemConfig };
  db.systemConfig = { ...db.systemConfig, ...req.body };

  AuditService.log({
    actorId: req.user!.id,
    actorName: req.user!.name,
    actorRole: req.user!.role,
    action: 'ADMIN_UPDATE_SYSTEM_CONFIG',
    resource: 'SYSTEM_SETTINGS',
    oldValue: oldConfig,
    newValue: db.systemConfig,
    ipAddress: req.ip
  });

  res.json({
      success: true,
      config: db.systemConfig
    });
  });

  // ============================================================================
  // CYBERPOOL FIX: CATEGORY CRUD — trước đây tab Danh Mục chỉ sửa state phía
  // client (AdminCategoriesTab không gọi callback, CatalogContext không gọi API),
  // reload là mất. Giờ persist xuống db.categories qua admin API có audit log.
  // ============================================================================

  // GET /api/v1/admin/categories
  adminRouter.get('/categories', (req: AuthenticatedRequest, res) => {
    res.json({ success: true, categories: db.categories });
  });

  // POST /api/v1/admin/categories
  adminRouter.post('/categories', (req: AuthenticatedRequest, res) => {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ success: false, error: 'Thiếu tên chuyên mục (name)' });
    }
    const slug = String(body.slug || body.name).trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '-');
    const id = body.id || `cat-${Date.now()}`;
    if (db.categories.some((c: any) => c.id === id)) {
      return res.status(409).json({ success: false, error: `Chuyên mục id "${id}" đã tồn tại` });
    }
    const category = {
      id,
      name: String(body.name).trim(),
      slug,
      parentId: body.parentId || null,
      iconName: body.iconName || 'Folder',
      productCount: Number(body.productCount) || 0,
      orderIndex: Number(body.orderIndex) || db.categories.length + 1,
      status: body.status === 'hidden' ? 'hidden' : 'active',
      fulfillmentType: body.fulfillmentType || 'manual',
      deliveryClassification: body.deliveryClassification || 'key_game',
      description: body.description || '',
      ...(body.count != null ? { count: Number(body.count) } : {})
    };
    db.categories.push(category);

    AuditService.log({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_CREATE_CATEGORY',
      resource: `CATEGORY:${id}`,
      newValue: category,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, category, categories: db.categories });
  });

  // PUT /api/v1/admin/categories/:id
  adminRouter.put('/categories/:id', (req: AuthenticatedRequest, res) => {
    const idx = db.categories.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy chuyên mục' });
    }
    const oldValue = { ...db.categories[idx] };
    const body = req.body || {};
    const updated: any = { ...oldValue };
    const allowed = ['name', 'slug', 'parentId', 'iconName', 'productCount', 'orderIndex', 'status', 'fulfillmentType', 'deliveryClassification', 'description', 'count'];
    for (const k of allowed) {
      if (body[k] !== undefined) updated[k] = body[k];
    }
    if (updated.status && updated.status !== 'hidden') updated.status = 'active';
    db.categories[idx] = updated;

    AuditService.log({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_UPDATE_CATEGORY',
      resource: `CATEGORY:${updated.id}`,
      oldValue,
      newValue: updated,
      ipAddress: req.ip
    });

    res.json({ success: true, category: updated, categories: db.categories });
  });

  // DELETE /api/v1/admin/categories/:id — xóa cả nhánh con (parentId = id),
  // khớp hành vi UI hiện tại (filter c.id !== id && c.parentId !== id)
  adminRouter.delete('/categories/:id', (req: AuthenticatedRequest, res) => {
    const id = req.params.id;
    const target = db.categories.find((c: any) => c.id === id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy chuyên mục' });
    }
    const removed = db.categories.filter((c: any) => c.id === id || c.parentId === id);
    db.categories = db.categories.filter((c: any) => c.id !== id && c.parentId !== id);

    AuditService.log({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_DELETE_CATEGORY',
      resource: `CATEGORY:${id}`,
      oldValue: removed,
      ipAddress: req.ip
    });

    res.json({ success: true, removedCount: removed.length, categories: db.categories });
    });

    // ============================================================================
    // CYBERPOOL FIX: WITHDRAWAL LIFECYCLE — trước đây /wallet/withdraw trừ ví rồi
    // báo "chờ duyệt" nhưng server không lưu request, không có approve/reject →
    // tiền treo vĩnh viễn. Giờ admin có đủ vòng đời, reject HOÀN TIỀN qua ledger.
    // ============================================================================

    // GET /api/v1/admin/withdrawals
    adminRouter.get('/withdrawals', (req: AuthenticatedRequest, res) => {
    const status = String(req.query.status || '');
    let list = db.withdrawals;
    if (status && status !== 'all') {
      list = list.filter((w: any) => w.status === status);
    }
    res.json({ success: true, withdrawals: list });
    });

    // POST /api/v1/admin/withdrawals/:id/approve — xác nhận đã giải ngân thật
    adminRouter.post('/withdrawals/:id/approve', (req: AuthenticatedRequest, res) => {
    const wd = db.withdrawals.find((w: any) => w.id === req.params.id);
    if (!wd) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền' });
    }
    if (wd.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Yêu cầu đã ở trạng thái "${wd.status}", không thể duyệt lại` });
    }
    wd.status = 'approved';
    wd.processedAt = new Date().toISOString();
    wd.processedBy = req.user!.id;
    wd.note = req.body?.note || wd.note || '';

    AuditService.log({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_APPROVE_WITHDRAWAL',
      resource: `WITHDRAWAL:${wd.id}`,
      newValue: wd,
      ipAddress: req.ip
    });

    res.json({ success: true, withdrawal: wd });
    });

    // POST /api/v1/admin/withdrawals/:id/reject — từ chối + HOÀN TIỀN về ví user
    adminRouter.post('/withdrawals/:id/reject', async (req: AuthenticatedRequest, res) => {
    const wd = db.withdrawals.find((w: any) => w.id === req.params.id);
    if (!wd) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền' });
    }
    if (wd.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Yêu cầu đã ở trạng thái "${wd.status}", không thể từ chối` });
    }
    const reason = String(req.body?.reason || '').trim() || 'Quản trị viên từ chối yêu cầu rút tiền';

    // Hoàn tiền về ví (REFUND credit) — bước trước đây hoàn toàn bị thiếu
    const refund = await LedgerService.executeTransaction({
      userId: wd.userId,
      type: 'REFUND',
      amount: wd.amount,
      description: `Hoàn tiền yêu cầu rút bị từ chối ${wd.id}: ${reason}`,
      referenceId: wd.id,
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      ipAddress: req.ip
    });

    if (!refund.success) {
      return res.status(500).json({ success: false, error: `Không thể hoàn tiền: ${refund.error}` });
    }

    wd.status = 'rejected';
    wd.processedAt = new Date().toISOString();
    wd.processedBy = req.user!.id;
    wd.note = reason;
    wd.refundTransactionId = refund.transaction?.id || '';

    AuditService.log({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRole: req.user!.role,
      action: 'ADMIN_REJECT_WITHDRAWAL',
      resource: `WITHDRAWAL:${wd.id}`,
      newValue: wd,
      ipAddress: req.ip
    });

    res.json({ success: true, withdrawal: wd, refunded: true });
    });

    // POST /api/v1/admin/test-card24h - Live test ping to Card24h API
adminRouter.post('/test-card24h', async (req: AuthenticatedRequest, res) => {
  // CYBERPOOL SECURITY FIX: real partner credentials were hardcoded as
  // fallbacks. Now only env/systemConfig may supply them — never source code.
  const partnerId = req.body?.partnerId || db.systemConfig?.telcoPartnerId || process.env.CARD24H_PARTNER_ID || '';
  const partnerKey = req.body?.partnerKey || db.systemConfig?.telcoPartnerKey || process.env.CARD24H_PARTNER_KEY || '';

  if (!partnerId || !partnerKey) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp Partner ID và Partner Key của Card24h'
    });
  }

  try {
    const testPin = '00000000000000';
    const testSerial = '10000000000';
    const testRequestId = `PING_${Date.now()}`;
    const sign = crypto.createHash('md5').update(`${partnerKey}${testPin}${testSerial}`).digest('hex');
    const testUrl = `https://card24h.com/chargingws/v2?sign=${sign}&telco=VIETTEL&code=${testPin}&serial=${testSerial}&amount=10000&request_id=${testRequestId}&partner_id=${partnerId}&command=charging`;

    const start = Date.now();
    const response = await fetch(testUrl);
    const latency = Date.now() - start;
    const data: any = await response.json();

    res.json({
      success: true,
      reachable: true,
      partnerId,
      latencyMs: latency,
      card24hStatus: data.status,
      card24hMessage: data.message,
      note: data.status === 3 && data.message === 'charging.invalid_card_code'
        ? 'Kết nối Card24h API hoàn toàn thành công! (Máy chủ Card24h đã nhận và xác thực Partner ID & Key)'
        : (data.message || 'Phản hồi từ Card24h'),
      raw: data
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      error: `Không thể kết nối đến máy chủ Card24h: ${err.message || 'Lỗi mạng'}`
    });
  }
});

// POST /api/v1/admin/test-binance - Test Binance Pay OpenAPI Connectivity
adminRouter.post('/test-binance', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await GatewayVerificationService.testBinanceApiConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi kiểm tra Binance API' });
  }
});

// POST /api/v1/admin/test-crypto-usdt - Test TronScan & BSC On-Chain Node Connectivity
adminRouter.post('/test-crypto-usdt', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await GatewayVerificationService.testTronScanCryptoConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi kiểm tra TronScan Node' });
  }
});

// POST /api/v1/admin/test-ltc - Test Litecoin Mainnet Core Blockchain Explorer
adminRouter.post('/test-ltc', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await GatewayVerificationService.testLitecoinConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi kiểm tra Litecoin Blockchain' });
  }
});

// POST /api/v1/admin/test-momo - Test MoMo Business Payment Gateway
adminRouter.post('/test-momo', async (req: AuthenticatedRequest, res) => {
  try {
    const result = await GatewayVerificationService.testMoMoApiConnection(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Lỗi kiểm tra MoMo API' });
  }
});
