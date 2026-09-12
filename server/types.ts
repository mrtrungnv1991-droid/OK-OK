export type UserRole = 
  | 'USER' 
  | 'SELLER' 
  | 'SUPPLIER' 
  | 'MODERATOR' 
  | 'SUPPORT' 
  | 'FINANCE' 
  | 'ADMIN' 
  | 'SUPER_ADMIN';

export type OrderStatus = 
  | 'PENDING_PAYMENT' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'DELIVERED' 
  | 'COMPLETED' 
  | 'DISPUTED' 
  | 'REFUNDED' 
  | 'CANCELLED'
  | 'PENDING_STOCK';

export type InventoryState = 
  | 'AVAILABLE' 
  | 'RESERVED' 
  | 'SOLD' 
  | 'DELIVERED' 
  | 'REFUNDED' 
  | 'DISABLED';

export type TransactionType = 
  | 'DEPOSIT' 
  | 'WITHDRAWAL' 
  | 'ESCROW_LOCK' 
  | 'ESCROW_RELEASE' 
  | 'ESCROW_REFUND' 
  | 'REFUND'
  | 'PURCHASE_INSTANT' 
  | 'TOPUP_GAME' 
  | 'SELLER_PAYOUT' 
  | 'AFFILIATE_COMMISSION' 
  | 'WHEEL_SPIN'
  | 'SYSTEM_ADJUSTMENT';

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  walletBalance: number;
  escrowLocked: number;
  affiliateEarnings: number;
  avatar: string;
  phone?: string;
  isVerified: boolean;
  status: 'active' | 'banned' | 'pending';
  createdAt: string;
  lastLoginAt: string;
  ipAddress?: string;
}

export interface ServerWalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  escrowBefore: number;
  escrowAfter: number;
  referenceId?: string; // Order ID, Escrow ID, Deposit ID
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REVERSED';
  idempotencyKey?: string;
  createdAt: string;
}

export interface ServerInventoryItem {
  id: string;
  productId: string;
  keyCode: string;
  pinCode?: string;
  state: InventoryState;
  reservedUntil?: number;
  orderId?: string;
  buyerId?: string;
  sellerId?: string;
  costPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerEscrowContract {
  id: string;
  productId: string;
  poolId: string;
  targetSlots: number;
  filledSlots: number;
  pricePerSlot: number;
  totalLockedAmount: number;
  status: 'FILLING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  expiresAt: string;
  participants: Array<{
    userId: string;
    userName: string;
    avatar: string;
    joinedAt: string;
    slotNumber: number;
    deliveredKey?: string;
  }>;
  createdAt: string;
}

export interface ServerOrder {
  id: string;
  buyerId: string;
  productId?: string;
  gameId?: string;
  productTitle: string;
  orderType: 'INSTANT_KEY' | 'GROUP_POOL' | 'DIRECT_TOPUP' | 'MANUAL_SERVICE';
  status: OrderStatus;
  pricePaid: number;
  originalPrice: number;
  discountAmount: number;
  deliveredData?: {
    keys?: string[];
    deliveryBranch?: string;
    accountCredentials?: any;
    inviteLink?: string;
    cardCode?: string;
    pinCode?: string;
    giftCardInfo?: any;
    giftUpCard?: any;
    topupUid?: string;
    topupServer?: string;
    characterName?: string;
    tierName?: string;
    [key: string]: any;
  };
  deliveryBranch?: string;
  escrowId?: string;
  poolId?: string;
  createdAt: string;
  completedAt?: string;
    txHash: string;
    // CYBERPOOL FIX: idempotency key honored server-side — the client already
    // sends one (src/api/orders.ts:23) but it was ignored, so a network retry
    // could double-charge the wallet and double-deliver the key.
    idempotencyKey?: string;
  }

export interface ServerAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

export interface ServerReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  productId: string;
  orderId: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ServerProductTranslation {
  id: string; // `${productId}_${language}`
  productId: string;
  language: string; // 'vi' | 'en' | 'zh' | 'ja' | 'ko' | 'ru' | 'fr' | 'de' | 'es' | ...
  title: string;
  subtitle?: string;
  description: string;
  deliveryEstimate?: string;
  features?: string[];
  instructions?: string[];
  tags?: string[];
  status: 'translated' | 'pending' | 'original' | 'failed';
  updatedAt: string;
}
