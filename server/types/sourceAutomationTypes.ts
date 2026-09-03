export interface SourceAccountConfig {
  id: string;
  sourceName: string; // e.g. "Muakey.com"
  sourceUrl: string; // e.g. "https://muakey.com"
  accountUsername: string;
  sessionToken: string; // Bearer token / Cookie / Session
  balance: number;
  currency: string;
  minThreshold: number; // e.g. 200000 VND
  status: 'ONLINE' | 'LOW_BALANCE' | 'SESSION_EXPIRING' | 'OFFLINE';
  lastChecked: string;
  autoReconcile: boolean;
  notes?: string;
}

export interface TelegramZeroDropConfig {
  botToken: string;
  chatId: string;
  backupChatId?: string;
  enabled: boolean;
  retryAttempts: number; // default 10
  sendThresholdAlerts: boolean;
  sendOrderPurchaseAlerts: boolean;
  inlineButtonsEnabled: boolean;
}

export interface TelegramQueueItem {
  id: string;
  orderId?: string;
  chatId: string;
  messageText: string;
  status: 'QUEUED' | 'SENDING' | 'DELIVERED' | 'RETRYING' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  deliveredAt?: string;
  httpStatus?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface SourcePendingOrder {
  id: string;
  orderCode: string;
  customerName: string;
  productTitle: string;
  productType: 'key_game' | 'account' | 'topup_manual' | 'gift_card';
  retailPrice: number;
  sourceEstimatedCost: number;
  sourceName: string;
  idempotencyKey: string;
  status: 'AWAITING_FUNDS' | 'PURCHASING_SOURCE' | 'KEY_EXTRACTED' | 'COMMITTED_VAULT' | 'FULFILLED' | 'MANUAL_SUPPORT';
  sourceAccountBalance: number;
  fundsNeeded: number;
  telegramAlertSent: boolean;
  deliveredContent?: string;
  accountDetails?: {
    uid?: string;
    emailDelivery?: string;
    accountNote?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DualStreamChatMessage {
  id: string;
  orderId: string;
  stream: 'CUSTOMER' | 'SOURCE_PROVIDER';
  sender: 'CUSTOMER' | 'ADMIN' | 'PROVIDER_SUPPORT';
  senderName: string;
  text: string;
  timestamp: string;
  isForwarded?: boolean;
}
