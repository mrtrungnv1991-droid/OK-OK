import { Router, Request, Response } from 'express';
import { notificationService } from '../../../services/notificationService';

export const notificationRouter = Router();

// GET /api/v1/notifications
notificationRouter.get('/', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'usr-buyer-01';
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
notificationRouter.post('/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.body.userId || 'usr-buyer-01';

  const success = notificationService.markAsRead(id, userId);
  res.json({
    success,
    message: success ? 'Đã đánh dấu đã đọc' : 'Không tìm thấy thông báo'
  });
});

// POST /api/v1/notifications/read-all
notificationRouter.post('/read-all', (req: Request, res: Response) => {
  const userId = req.body.userId || 'usr-buyer-01';
  notificationService.markAllAsRead(userId);

  res.json({
    success: true,
    message: 'Đã đánh dấu đọc tất cả thông báo'
  });
});
