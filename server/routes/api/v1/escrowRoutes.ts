import { Router } from 'express';
import { db } from '../../../db/store';
import { requireAuth, requireRole, AuthenticatedRequest } from '../../../middleware/authMiddleware';
import { EscrowService } from '../../../services/escrowService';

export const escrowRouter = Router();

// GET /api/v1/escrow/pools - Get Active Escrow Group Pools
escrowRouter.get('/pools', (req, res) => {
  const pools = Array.from(db.escrowContracts.values());
  res.json({
    success: true,
    pools
  });
});

// POST /api/v1/escrow/join - Join Escrow Group Pool
escrowRouter.post('/join', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { poolId, productId } = req.body;

  if (!poolId || !productId) {
    return res.status(400).json({ success: false, error: 'poolId and productId are required' });
  }

  const result = await EscrowService.joinPool({
    poolId,
    productId,
    user: req.user!,
    ipAddress: req.ip
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  // CYBERPOOL FIX: trả về shape khớp client (escrowApi.joinPool đọc pool/message)
  const completed = result.contract.status === 'COMPLETED';
  res.json({
    success: true,
    pool: result.contract,
    order: result.order,
    message: completed
      ? '🎉 Nhóm gom đơn đã ĐỦ thành viên — key bản quyền thật đã được chuyển vào Kho Key của bạn!'
      : `Đã khóa tiền slot thành công. Bạn là thành viên #${result.contract.filledSlots}/${result.contract.targetSlots} — key sẽ bung ngay khi đủ nhóm!`
  });
});

// POST /api/v1/escrow/admin/refund - Admin Force Refund Pool
escrowRouter.post('/admin/refund', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
  const { poolId } = req.body;
  const success = await EscrowService.forceRefundPool(poolId, req.user!.id, req.user!.name);

  res.json({
    success,
    message: success ? 'Đã hoàn tiền thành công cho toàn bộ thành viên trong nhóm gom' : 'Không tìm thấy nhóm hoặc nhóm đã hoàn tất'
  });
});
