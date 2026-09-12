import {
  ServerUser,
  ServerWalletTransaction,
  ServerInventoryItem,
  ServerEscrowContract,
  ServerOrder,
  ServerAuditLog,
  ServerReview,
  ServerProductTranslation
} from '../types';
import crypto from 'crypto';
import { hashPassword } from '../utils/authSecurity';
import { INITIAL_PRODUCTS } from '../../src/data/mockProducts';
import { INITIAL_GAMES, INITIAL_SUPPLIERS } from '../../src/data/mockTopupGames';
import { INITIAL_VOUCHERS } from '../../src/data/systemAdminData';
import { ALL_PRODUCTS_DATA } from '../../src/i18n/catalogData/allProductsData';
import { PRODUCT_TRANSLATIONS } from '../../src/i18n/catalogTranslations';
import { GameStorageService } from '../services/gameStorageService';

class DatabaseStore {
  public users: Map<string, ServerUser> = new Map();
  public transactions: ServerWalletTransaction[] = [];
  // CYBERPOOL FIX: withdrawal lifecycle store — trước đây /wallet/withdraw trừ ví
  // rồi "chờ duyệt" nhưng không lưu request nào trên server → admin không thể
  // duyệt/từ chối, reject không hoàn tiền (user mất tiền vĩnh viễn).
  public withdrawals: any[] = [];
  public inventory: Map<string, ServerInventoryItem> = new Map();
  public escrowContracts: Map<string, ServerEscrowContract> = new Map();
  public orders: Map<string, ServerOrder> = new Map();
  public reviews: ServerReview[] = [];
  public auditLogs: ServerAuditLog[] = [];
  public productTranslations: Map<string, ServerProductTranslation> = new Map();
  public products: any[] = [];
  public games: any[] = [];
  public suppliers: any[] = [];
  public vouchers: any[] = [];
  public categories: any[] = [];
  public tickets: any[] = [];
  public systemConfig: any = {};
  public telcoCards: Map<string, any> = new Map();
  public processedWebhooks: Map<string, { amount: number; userId: string; status: string; processedAt: string; provider: string; memo?: string }> = new Map();
    public depositIntents: Map<string, { id: string; userId: string; amount: number; methodTitle: string; idempotencyKey: string; status: string; createdAt: string; expiresAt: string }> = new Map();
    public pendingUnmappedDeposits: Array<{ id: string; provider: string; transactionId: string; amount: number; memo: string; rawPayload: any; receivedAt: string; status: 'PENDING_REVIEW' | 'RESOLVED' | 'REJECTED' }> = [];

  // Mutex lock trackers
  private inventoryLocks: Set<string> = new Set();
  private userLocks: Set<string> = new Set();

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
      // 1. Users
      const isProduction = process.env.NODE_ENV === 'production';

      // CYBERPOOL SECURITY FIX: the default SUPER_ADMIN credential
      // (admin@cyberpool.vn / Admin@CyberPool2026!) is hardcoded in this public
      // repo. In production we never seed it — instead generate a random
      // one-time password logged to the operator so the known default cannot be
      // used to log into a live system.
      const adminSeedPassword = isProduction
        ? (() => {
            const gen = crypto.randomBytes(9).toString('base64url');
            console.warn('[SECURITY] Seeded SUPER_ADMIN with a RANDOM one-time password: ' + gen);
            return gen;
          })()
        : 'Admin@CyberPool2026!';

      const defaultUsers: ServerUser[] = [
        {
          id: 'usr-admin-01',
          email: 'admin@cyberpool.vn',
          name: 'CyberPool SuperAdmin',
          role: 'SUPER_ADMIN',
          passwordHash: hashPassword(adminSeedPassword),
          walletBalance: 50000000,
        escrowLocked: 0,
        affiliateEarnings: 2450000,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        lastLoginAt: new Date().toISOString(),
        ipAddress: '127.0.0.1'
      },
      {
        id: 'usr-buyer-01',
        email: 'lombard2508@gmail.com',
        name: 'CyberTrader_Vip',
        role: 'USER',
        passwordHash: hashPassword('CyberPass2026!'),
        walletBalance: 2450000,
        escrowLocked: 150000,
        affiliateEarnings: 320000,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isVerified: true,
        status: 'active',
        createdAt: '2026-02-15T10:30:00Z',
        lastLoginAt: new Date().toISOString(),
        ipAddress: '113.190.234.12'
      }
    ];

    defaultUsers.forEach(u => this.users.set(u.id, u));

    // 2. Products
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS)).map((p: any) => {
      // Ensure immutable original fields
      p.title_original = p.title_original || p.title;
      p.description_original = p.description_original || p.description;
      p.original_language = p.original_language || 'vi';

      // Seed translations from dictionaries if available
      const translations: Record<string, any> = {};
      const srcDict = ALL_PRODUCTS_DATA[p.id] || PRODUCT_TRANSLATIONS[p.id];
      if (srcDict) {
        Object.entries(srcDict).forEach(([lang, data]: [string, any]) => {
          translations[lang] = data;
          const trId = `${p.id}_${lang}`;
          this.productTranslations.set(trId, {
            id: trId,
            productId: p.id,
            language: lang,
            title: data.title || p.title,
            subtitle: data.subtitle || p.subtitle,
            description: data.description || p.description,
            deliveryEstimate: data.deliveryEstimate || p.deliveryEstimate,
            features: data.features || p.features,
            instructions: data.instructions || p.instructions,
            tags: data.tags || p.tags,
            status: 'translated',
            updatedAt: new Date().toISOString()
          });
        });
      }
      p.translations = translations;
      return p;
    });
    this.games = GameStorageService.loadGames();
    this.suppliers = JSON.parse(JSON.stringify(INITIAL_SUPPLIERS));
    this.vouchers = JSON.parse(JSON.stringify(INITIAL_VOUCHERS));

    // 3. Seed Inventory with digital keys
    this.products.forEach(p => {
      for (let i = 1; i <= 20; i++) {
        const itemId = `inv-${p.id}-${i}`;
        const keyItem: ServerInventoryItem = {
          id: itemId,
          productId: p.id,
          keyCode: `CYBER-${p.platform.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
          state: i <= 5 ? 'SOLD' : 'AVAILABLE',
          costPrice: Math.round(p.retailPrice * 0.4),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.inventory.set(itemId, keyItem);
      }

      // Seed active escrow contracts for pools
      if (p.activePools && p.activePools.length > 0) {
        p.activePools.forEach((pool: any) => {
          this.escrowContracts.set(pool.id, {
            id: `escrow-${pool.id}`,
            productId: p.id,
            poolId: pool.id,
            targetSlots: pool.targetSlots,
            filledSlots: pool.filledSlots,
            pricePerSlot: pool.pricePerSlot,
            totalLockedAmount: pool.filledSlots * pool.pricePerSlot,
            status: pool.status === 'completed' ? 'COMPLETED' : 'FILLING',
            expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
            participants: pool.participants.map((pt: any) => ({
              userId: pt.id || 'usr-mock',
              userName: pt.name,
              avatar: pt.avatar,
              joinedAt: pt.joinedAt,
              slotNumber: pt.slotNumber,
              deliveredKey: pool.status === 'completed' ? `KEY-DELIVERED-${pt.slotNumber}` : undefined
            })),
            createdAt: new Date().toISOString()
          });
        });
      }
    });

    // 4. Initial Audit Log
    this.auditLogs.push({
      id: 'audit-001',
      actorId: 'usr-admin-01',
      actorName: 'CyberPool SuperAdmin',
      actorRole: 'SUPER_ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      resource: 'SERVER_ENGINE',
      resourceId: 'NODE_FAST_API_GATEWAY',
      newValue: { status: 'ONLINE', modules: ['AUTH', 'LEDGER', 'ORDER_ENGINE', 'ESCROW', 'INVENTORY'] },
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    // 5. Initial Categories — CYBERPOOL FIX: full CategoryItem shape (UI reads
    // iconName/productCount/orderIndex/status/fulfillmentType; seed cũ chỉ có
    // {id,name,slug,count} khiến tab Danh Mục phải fallback về mock data)
    this.categories = [
      { id: 'all', name: 'Tất Cả Sản Phẩm', slug: 'all', count: 50, productCount: 50, iconName: 'Layers', parentId: null, orderIndex: 1, status: 'active', fulfillmentType: 'manual', deliveryClassification: 'key_game' },
      { id: 'ai_tools', name: 'AI & Machine Learning', slug: 'ai-tools', count: 12, productCount: 12, iconName: 'Cpu', parentId: null, orderIndex: 2, status: 'active', fulfillmentType: 'automatic', deliveryClassification: 'key_game' },
      { id: 'entertainment', name: 'Giải Trí & Phim Ảnh', slug: 'entertainment', count: 10, productCount: 10, iconName: 'Film', parentId: null, orderIndex: 3, status: 'active', fulfillmentType: 'manual', deliveryClassification: 'account' },
      { id: 'software', name: 'Bản Quyền Phần Mềm', slug: 'software', count: 8, productCount: 8, iconName: 'Shield', parentId: null, orderIndex: 4, status: 'active', fulfillmentType: 'automatic', deliveryClassification: 'key_game' },
      { id: 'gaming', name: 'Gaming & Steam Vault', slug: 'gaming', count: 15, productCount: 15, iconName: 'Gamepad2', parentId: null, orderIndex: 5, status: 'active', fulfillmentType: 'automatic', deliveryClassification: 'key_game' },
      { id: 'vpn_security', name: 'VPN & An Ninh Mạng', slug: 'vpn-security', count: 5, productCount: 5, iconName: 'Lock', parentId: null, orderIndex: 6, status: 'active', fulfillmentType: 'automatic', deliveryClassification: 'account' }
    ];

    // 6. System Config
    this.systemConfig = {
      siteTitle: 'CYBERPOOL // Production Marketplace',
      siteName: 'CyberPool Engine v8.0',
      platformFeePercent: 2,
      minDepositAmount: 10000,
      minWithdrawalAmount: 100000,
      escrowTimeoutHours: 48,
      antiDDoSMode: 'advanced_waf',
      maintenanceMode: false,
      // Card24h API configuration
      telcoProvider: 'card24h',
      telcoPartnerId: process.env.CARD24H_PARTNER_ID || '',
      telcoPartnerKey: process.env.CARD24H_PARTNER_KEY || '',
      telcoWalletId: process.env.CARD24H_WALLET_ID || '',
      telcoCallbackUrl: '/api/v1/webhooks/card24h'
    };
  }

  // Mutex helpers for Atomic Operations
  public async acquireInventoryLock(productId: string): Promise<boolean> {
    if (this.inventoryLocks.has(productId)) {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 20));
        if (!this.inventoryLocks.has(productId)) break;
      }
    }
    this.inventoryLocks.add(productId);
    return true;
  }

  public releaseInventoryLock(productId: string) {
    this.inventoryLocks.delete(productId);
  }

  public async acquireUserLock(userId: string): Promise<boolean> {
    this.userLocks.add(userId);
    return true;
  }

  public releaseUserLock(userId: string) {
    this.userLocks.delete(userId);
  }
}

export const db = new DatabaseStore();
