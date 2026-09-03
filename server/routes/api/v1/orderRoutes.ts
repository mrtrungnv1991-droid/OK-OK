import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { OrderService } from '../../../services/orderService';
import { ServerOrder } from '../../../types';

export const orderRouter = Router();

// GET /api/v1/orders - User Order History / Key Vault
orderRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  const userOrders = Array.from(db.orders.values())
    .filter((o: ServerOrder) => o.buyerId === req.user!.id)
    .sort((a: ServerOrder, b: ServerOrder) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    orders: userOrders
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
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: 'productId is required' });
  }

  const result = await OrderService.createInstantPurchase({
    buyer: req.user!,
    productId,
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
