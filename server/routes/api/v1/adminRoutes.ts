import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { AuditService } from '../../../services/auditService';

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
