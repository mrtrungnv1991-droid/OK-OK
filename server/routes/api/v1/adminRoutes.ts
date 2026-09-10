import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { AuditService } from '../../../services/auditService';
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

// POST /api/v1/admin/test-card24h - Live test ping to Card24h API
adminRouter.post('/test-card24h', async (req: AuthenticatedRequest, res) => {
  const partnerId = req.body?.partnerId || db.systemConfig?.telcoPartnerId || '16654919157';
  const partnerKey = req.body?.partnerKey || db.systemConfig?.telcoPartnerKey || 'bc3299820230bb1ed2b2b729cac744e3';

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
