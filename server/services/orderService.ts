import { db } from '../db/store';
import { ServerOrder, ServerUser, OrderStatus } from '../types';
import { LedgerService } from './ledgerService';
import { InventoryService } from './inventoryService';
import { AuditService } from './auditService';

export class OrderService {
  /**
   * Processes instant single-item product purchase with atomic digital delivery
   */
  public static async createInstantPurchase(params: {
    buyer: ServerUser;
    productId: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; order?: ServerOrder; error?: string }> {
    const { buyer, productId, ipAddress } = params;
    const product = db.products.find(p => p.id === productId);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    const price = product.retailPrice;

    if (buyer.walletBalance < price) {
      return { 
        success: false, 
        error: `Số dư ví không đủ. Cần: ${price.toLocaleString()}đ, Hiện có: ${buyer.walletBalance.toLocaleString()}đ` 
      };
    }

    const orderId = `ord-inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // 1. Reserve digital item from inventory vault
    const reservedItem = await InventoryService.reserveItem(productId, buyer.id, orderId);
    const deliveredKey = reservedItem?.keyCode || `CYBER-${product.platform.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (reservedItem) {
      InventoryService.markDelivered(reservedItem.id);
    }

    // 2. Deduct funds via double-entry ledger
    const ledgerRes = await LedgerService.executeTransaction({
      userId: buyer.id,
      type: 'PURCHASE_INSTANT',
      amount: -price,
      description: `Mua lẻ bản quyền: ${product.title}`,
      referenceId: orderId,
      ipAddress
    });

    if (!ledgerRes.success) {
      // Release reserved item if payment fails
      if (reservedItem) {
        InventoryService.releaseReservation(reservedItem.id);
      }
      return { success: false, error: ledgerRes.error || 'Payment execution failed' };
    }

    // 3. Create fulfilled Order record
    const order: ServerOrder = {
      id: orderId,
      buyerId: buyer.id,
      productId: product.id,
      productTitle: product.title,
      orderType: 'INSTANT_KEY',
      status: 'COMPLETED',
      pricePaid: price,
      originalPrice: product.retailPrice,
      discountAmount: (product.retailPrice - price),
      deliveredData: {
        keys: [deliveredKey],
        giftUpCard: product.deliveryType === 'giftup_card' ? {
          cardNumber: `4928 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
          pinCode: '7721',
          barcode: `GU-INSTANT-${Math.floor(1000 + Math.random() * 9000)}`,
          balance: 50,
          currency: 'USD'
        } : undefined
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 32)}`
    };

    db.orders.set(order.id, order);

    AuditService.log({
      actorId: buyer.id,
      actorName: buyer.name,
      actorRole: buyer.role,
      action: 'ORDER_INSTANT_PURCHASE',
      resource: 'ORDER',
      resourceId: order.id,
      newValue: { productId, pricePaid: price, keyDelivered: true },
      ipAddress
    });

    return { success: true, order };
  }

  /**
   * Processes Game Direct Topup
   */
  public static async createGameTopup(params: {
    buyer: ServerUser;
    gameId: string;
    tierId: string;
    uid: string;
    zoneId?: string;
    server?: string;
    characterName?: string;
    ipAddress?: string;
  }): Promise<{ success: boolean; order?: ServerOrder; error?: string }> {
    const { buyer, gameId, tierId, uid, zoneId, server, characterName, ipAddress } = params;

    const game = db.games.find(g => g.id === gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const tier = game.tiers?.find((t: any) => t.id === tierId);
    if (!tier) {
      return { success: false, error: 'Topup tier not found' };
    }

    const price = tier.price;

    if (buyer.walletBalance < price) {
      return { 
        success: false, 
        error: `Số dư ví không đủ để nạp. Cần: ${price.toLocaleString()}đ, Hiện có: ${buyer.walletBalance.toLocaleString()}đ` 
      };
    }

    const orderId = `ord-topup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Deduct via Ledger
    const ledgerRes = await LedgerService.executeTransaction({
      userId: buyer.id,
      type: 'TOPUP_GAME',
      amount: -price,
      description: `Nạp ${game.title} [${tier.name}] - UID: ${uid}`,
      referenceId: orderId,
      ipAddress
    });

    if (!ledgerRes.success) {
      return { success: false, error: ledgerRes.error || 'Payment execution failed' };
    }

    const order: ServerOrder = {
      id: orderId,
      buyerId: buyer.id,
      gameId: game.id,
      productTitle: `${game.title} - ${tier.name}`,
      orderType: 'DIRECT_TOPUP',
      status: 'COMPLETED',
      pricePaid: price,
      originalPrice: tier.originalPrice || price,
      discountAmount: (tier.originalPrice || price) - price,
      deliveredData: {
        topupUid: uid,
        topupServer: server || zoneId || 'Global',
        characterName: characterName || 'Player_' + uid.slice(-4),
        tierName: tier.name
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      txHash: `TX-TOPUP-${Date.now()}`
    };

    db.orders.set(order.id, order);

    return { success: true, order };
  }

  /**
   * Transition order state (State machine)
   */
  public static updateOrderStatus(orderId: string, nextStatus: OrderStatus, actor: { id: string; name: string; role: any }): boolean {
    const order = db.orders.get(orderId);
    if (!order) return false;

    const oldStatus = order.status;
    order.status = nextStatus;
    if (nextStatus === 'COMPLETED') {
      order.completedAt = new Date().toISOString();
    }
    db.orders.set(orderId, order);

    AuditService.log({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'ORDER_STATUS_TRANSITION',
      resource: 'ORDER',
      resourceId: orderId,
      oldValue: { status: oldStatus },
      newValue: { status: nextStatus }
    });

    return true;
  }
}
