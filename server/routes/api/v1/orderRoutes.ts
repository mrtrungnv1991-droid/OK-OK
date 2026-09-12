import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { OrderService } from '../../../services/orderService';
import { IdempotencyService } from '../../../services/idempotencyService';
import { ServerOrder } from '../../../types';

export const orderRouter = Router();

// GET /api/v1/orders - User Order History / Key Vault / Admin View
orderRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  const showAll = req.query.all === 'true' && isAdmin;

  const orders = Array.from(db.orders.values())
    .filter((o: ServerOrder) => showAll ? true : o.buyerId === req.user!.id)
    .sort((a: ServerOrder, b: ServerOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    orders
  });
});

// GET /api/v1/orders/admin/all - Explicit Admin Endpoint for Sold Orders & Reporting
orderRouter.get('/admin/all', requireAuth, (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Quyền truy cập bị từ chối' });
  }

  const allOrders = Array.from(db.orders.values())
    .sort((a: ServerOrder, b: ServerOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    orders: allOrders
  });
});

// GET /api/v1/orders/:id
orderRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const order = db.orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  // Ensure buyer owns order or user is admin
  if (order.buyerId !== req.user!.id && req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  res.json({
    success: true,
    order
  });
});

// POST /api/v1/orders/instant-buy - Instant Single Key/Account Purchase
orderRouter.post('/instant-buy', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { productId, quantity, paymentMethod, voucherCode, finalTotal, idempotencyKey } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: 'productId is required' });
  }

  // CYBERPOOL FIX: honor the client idempotency key. If the same buyer already
  // placed this order (network retry / double-click), return the existing order
  // instead of charging the wallet again.
  // CYBERPOOL FIX (#17): trước đây check-then-create có nhiều await ở giữa →
  // 2 request song song cùng key đều pass check và trừ tiền 2 lần. Giờ dùng
  // in-flight lock của IdempotencyService (cùng pattern VietQR webhook).
  if (typeof idempotencyKey === 'string' && idempotencyKey.length > 0) {
    const idemKey = `INSTANT_${req.user!.id}_${idempotencyKey}`;
    for (const existing of db.orders.values()) {
      if (existing.buyerId === req.user!.id && existing.idempotencyKey === idempotencyKey) {
        return res.json({
          success: true,
          order: existing,
          deliveredKey: existing.deliveredData?.keys?.[0] || '',
          message: 'Đơn hàng đã được xử lý trước đó (idempotent replay).',
          idempotent_replay: true
        });
      }
    }
    const lockOk = await IdempotencyService.acquireLock(idemKey);
    if (!lockOk) {
      return res.status(429).json({
        success: false,
        error: 'Yêu cầu mua đang được xử lý (trùng lặp). Vui lòng đợi trong giây lát.'
      });
    }
    try {
      // Double-check sau khi giành lock (request trước có thể vừa tạo order)
      for (const existing of db.orders.values()) {
        if (existing.buyerId === req.user!.id && existing.idempotencyKey === idempotencyKey) {
          return res.json({
            success: true,
            order: existing,
            deliveredKey: existing.deliveredData?.keys?.[0] || '',
            message: 'Đơn hàng đã được xử lý trước đó (idempotent replay).',
            idempotent_replay: true
          });
        }
      }
      const result = await OrderService.createInstantPurchase({
        buyer: req.user!,
        productId,
        quantity: Number(quantity) || 1,
        paymentMethod: paymentMethod || 'wallet',
        voucherCode,
        finalTotal: typeof finalTotal === 'number' ? finalTotal : undefined,
        idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
        ipAddress: req.ip
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } finally {
      IdempotencyService.releaseLock(idemKey);
    }
  }

  const result = await OrderService.createInstantPurchase({
    buyer: req.user!,
    productId,
    quantity: Number(quantity) || 1,
    paymentMethod: paymentMethod || 'wallet',
    voucherCode,
    finalTotal: typeof finalTotal === 'number' ? finalTotal : undefined,
    idempotencyKey: typeof idempotencyKey === 'string' ? idempotencyKey : undefined,
    ipAddress: req.ip
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});

// POST /api/v1/orders/topup-game - Direct Game Currency Top-Up
orderRouter.post('/topup-game', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { gameId, tierId, uid, zoneId, server, characterName } = req.body;

  if (!gameId || !tierId || !uid) {
    return res.status(400).json({ success: false, error: 'Missing required topup parameters' });
  }

  const result = await OrderService.createGameTopup({
    buyer: req.user!,
    gameId,
    tierId,
    uid,
    zoneId,
    server,
    characterName,
    ipAddress: req.ip
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
});
