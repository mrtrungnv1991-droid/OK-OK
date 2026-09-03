import { Router, Request, Response } from 'express';
import { affiliateService } from '../../../services/affiliateService';

export const affiliateRouter = Router();

// GET /api/v1/affiliate/stats
affiliateRouter.get('/stats', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr-buyer-01';
  const result = affiliateService.getStats(userId);

  res.json({
    success: true,
    data: result
  });
});

// POST /api/v1/affiliate/claim
affiliateRouter.post('/claim', (req: Request, res: Response) => {
  const userId = req.body.userId || 'usr-buyer-01';
  const result = affiliateService.getStats(userId);

  if (result.stats.availableBalance <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Không có hoa hồng khả dụng để rút về ví (hoa hồng đang trong thời hạn bảo hành 7 ngày)'
    });
  }

  res.json({
    success: true,
    data: {
      claimedAmount: result.stats.availableBalance,
      message: `Đã kết chuyển thành công ${result.stats.availableBalance.toLocaleString('vi-VN')}đ hoa hồng vào ví chính!`
    }
  });
});
