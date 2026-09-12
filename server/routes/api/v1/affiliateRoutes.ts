import { Router } from 'express';
import { affiliateService } from '../../../services/affiliateService';
import { LedgerService } from '../../../services/ledgerService';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';

export const affiliateRouter = Router();

// CYBERPOOL SECURITY FIX (#12): trước đây cả 2 route KHÔNG auth và nhận userId
// từ query/body với default 'usr-buyer-01' → IDOR đọc hoa hồng của bất kỳ ai,
// và /claim trả "thành công" ảo không chuyển tiền. Giờ bắt buộc đăng nhập và
// chỉ dùng req.user.id.
affiliateRouter.use(requireAuth);

// GET /api/v1/affiliate/stats
affiliateRouter.get('/stats', (req: AuthenticatedRequest, res) => {
  const result = affiliateService.getStats(req.user!.id);

  res.json({
    success: true,
    data: result
  });
});

// POST /api/v1/affiliate/claim — kết chuyển hoa hồng UNLOCKED về ví thật
affiliateRouter.post('/claim', async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Release các commission đã hết 7 ngày bảo hành trước khi tính số khả dụng
  affiliateService.releaseMaturedCommissions();

  const { claimedAmount, commissionIds } = affiliateService.claimCommissions(userId);

  if (claimedAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Không có hoa hồng khả dụng để rút về ví (hoa hồng đang trong thời hạn bảo hành 7 ngày)'
    });
  }

  // Credit ví THẬT qua ledger double-entry
  const ledger = await LedgerService.executeTransaction({
    userId,
    type: 'AFFILIATE_COMMISSION',
    amount: claimedAmount,
    description: `Kết chuyển ${commissionIds.length} hoa hồng affiliate về ví chính`,
    actorId: userId,
    ipAddress: req.ip
  });

  if (!ledger.success) {
    return res.status(500).json({ success: false, error: ledger.error || 'Không thể cộng hoa hồng vào ví' });
  }

  res.json({
    success: true,
    data: {
      claimedAmount,
      claimedCount: commissionIds.length,
      newBalance: ledger.transaction?.balanceAfter,
      message: `Đã kết chuyển thành công ${claimedAmount.toLocaleString('vi-VN')}đ hoa hồng vào ví chính!`
    }
  });
});
