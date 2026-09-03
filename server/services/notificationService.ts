export interface AppNotification {
  id: string;
  userId: string;
  type: 
    | 'ORDER_CREATED' 
    | 'PAYMENT_SUCCESS' 
    | 'KEY_DELIVERED' 
    | 'ESCROW_JOINED' 
    | 'ESCROW_COMPLETED' 
    | 'ESCROW_DISPUTED' 
    | 'ESCROW_RESOLVED' 
    | 'TOPUP_COMPLETED' 
    | 'WITHDRAWAL_STATUS' 
    | 'SECURITY_ALERT' 
    | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

class NotificationService {
  private notifications: AppNotification[] = [
    {
      id: 'notif-1',
      userId: 'usr-buyer-01',
      type: 'PAYMENT_SUCCESS',
      title: 'Nạp tiền thành công',
      message: 'Giao dịch VietQR +1,000,000đ đã được cộng vào ví của bạn.',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'notif-2',
      userId: 'usr-buyer-01',
      type: 'KEY_DELIVERED',
      title: 'Đã nhận bản quyền',
      message: 'Mã bản quyền ChatGPT Plus (#ORD-9921) đã sẵn sàng trong Key Vault.',
      isRead: false,
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  public send(
    userId: string,
    type: AppNotification['type'],
    title: string,
    message: string,
    data?: Record<string, any>
  ): AppNotification {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
    return notif;
  }

  public getForUser(userId: string, limit: number = 20): AppNotification[] {
    return this.notifications.filter(n => n.userId === userId || n.userId === 'ALL').slice(0, limit);
  }

  public getUnreadCount(userId: string): number {
    return this.notifications.filter(n => (n.userId === userId || n.userId === 'ALL') && !n.isRead).length;
  }

  public markAsRead(notificationId: string, userId: string): boolean {
    const notif = this.notifications.find(n => n.id === notificationId && (n.userId === userId || n.userId === 'ALL'));
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead(userId: string): void {
    this.notifications.forEach(n => {
      if (n.userId === userId || n.userId === 'ALL') {
        n.isRead = true;
      }
    });
  }
}

export const notificationService = new NotificationService();
