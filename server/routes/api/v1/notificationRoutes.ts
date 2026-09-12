import { Router } from 'express';
import { notificationService } from '../../../services/notificationService';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/authMiddleware';

export const notificationRouter = Router();

// CYBERPOOL SECURITY FIX (#12): trước đây KHÔNG auth, userId lấy từ query/body
// với default 'usr-buyer-01' → IDOR đọc/đánh dấu thông báo của bất kỳ user nào.
// Giờ bắt buộc đăng nhập và chỉ thao tác trên thông báo của chính mình.
notificationRouter.use(requireAuth);

// GET /api/v1/notifications
notificationRouter.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 20;

  const notifications = notificationService.getForUser(userId, limit);
  const unreadCount = notificationService.getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount
    }
  });
});

// POST /api/v1/notifications/:id/read
notificationRouter.post('/:id/read', (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const success = notificationService.markAsRead(id, userId);
  res.json({
    success,
    message: success ? 'Đã đánh dấu đã đọc' : 'Không tìm thấy thông báo'
  });
});

// POST /api/v1/notifications/read-all
notificationRouter.post('/read-all', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  notificationService.markAllAsRead(userId);

  res.json({
    success: true,
    message: 'Đã đánh dấu đọc tất cả thông báo'
  });
});
