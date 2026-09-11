import crypto from 'crypto';
import { db } from '../db/store';
import { ServerOrder, ServerUser, OrderStatus } from '../types';
import { LedgerService } from './ledgerService';
import { InventoryService } from './inventoryService';
import { AuditService } from './auditService';
import { SupplierManagerService } from './supplierHub/services/SupplierManagerService';
import { cyborgPipelineService } from './sourceConnector/cyborgPipelineService';
import { detectDeliveryBranch, parseDeliveredOutput, DeliveryBranch } from './supplierHub/utils/deliveryBranchDetector';
import { paymentStore } from './paymentSystem/store';
import { paymentWorkerService } from './paymentSystem/workers';
import { PaymentTransaction } from './paymentSystem/types';

export class OrderService {
  /**
   * Processes instant single-item product purchase with atomic digital delivery
   * Supports both local products and API source products (G2UP / ShopClone)
   */
  public static async createInstantPurchase(params: {
    buyer: ServerUser;
    productId: string;
    quantity?: number;
    paymentMethod?: 'wallet' | 'vietqr' | 'telco' | 'card';
    voucherCode?: string;
    finalTotal?: number;
    ipAddress?: string;
  }): Promise<{ success: boolean; order?: ServerOrder; deliveredKey?: string; error?: string }> {
    const { buyer, productId, quantity = 1, paymentMethod = 'wallet', voucherCode, ipAddress } = params;
    const product = db.products.find(p => p.id === productId);

    if (!product) {
      return { success: false, error: 'Không tìm thấy sản phẩm trong hệ thống' };
    }

    if ((product.stockAvailable !== undefined && product.stockAvailable <= 0) || product.status === 'OUT_OF_STOCK' || product.isAvailable === false) {
      return {
        success: false,
        error: `Sản phẩm "${product.title}" hiện tại đã hết hàng trong kho. Vui lòng chọn sản phẩm khác hoặc quay lại sau!`
      };
    }

    // F03: Kiểm tra số lượng hợp lệ
    const validQuantity = Math.floor(Number(quantity || 1));
    if (!Number.isInteger(validQuantity) || validQuantity <= 0 || validQuantity > 100) {
      return { success: false, error: 'Số lượng mua không hợp lệ (từ 1 đến 100)' };
    }

    // F03: Server tự tính giá dựa trên retailPrice và voucher, client không được tự ý quyết định finalTotal
    const unitPrice = Number(product.retailPrice || 0);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      return { success: false, error: 'Giá sản phẩm không hợp lệ' };
    }

    let calculatedPrice = unitPrice * validQuantity;
    if (voucherCode) {
      const voucher = db.vouchers?.find(v => v.code?.toUpperCase() === voucherCode.toUpperCase() && v.active);
      if (voucher) {
        if (voucher.type === 'percent') {
          const discount = Math.round((calculatedPrice * Number(voucher.discount)) / 100);
          calculatedPrice = Math.max(0, calculatedPrice - discount);
        } else if (voucher.type === 'fixed') {
          calculatedPrice = Math.max(0, calculatedPrice - Number(voucher.discount));
        }
      }
    }
    const price = calculatedPrice;

    // F03: Chưa có phương thức thanh toán ngoài ví thì chặn phương thức đó
    if (paymentMethod !== 'wallet') {
      return {
        success: false,
        error: 'Phương thức thanh toán trực tiếp ngoài ví chưa hỗ trợ mua hàng tự động. Vui lòng nạp tiền vào ví hoặc chọn thanh toán bằng Ví CyberPool.'
      };
    }

    if (buyer.walletBalance < price) {
      return { 
        success: false, 
        error: `Số dư ví không đủ. Cần: ${price.toLocaleString('vi-VN')}đ, Hiện có: ${buyer.walletBalance.toLocaleString('vi-VN')}đ` 
      };
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // F04 & F05: Kiểm tra tồn kho và giữ hàng trước khi trừ tiền ví
    const isSupplierProduct = Boolean(product.supplierId || (product as any).source_info);
    let reservedItems: any[] = [];
    let deliveredKey = '';
    let deliveredKeys: string[] = [];
    let supplierOrderInfo: any = null;

    if (!isSupplierProduct) {
      // Kho nội bộ: Giữ đúng số lượng validQuantity
      for (let i = 0; i < validQuantity; i++) {
        const item = await InventoryService.reserveItem(productId, buyer.id, orderId);
        if (item) {
          reservedItems.push(item);
        } else {
          break;
        }
      }

      if (reservedItems.length < validQuantity) {
        // Hủy giữ các item đã reserve nếu không đủ số lượng
        for (const item of reservedItems) {
          InventoryService.releaseReservation(item.id);
        }
        return {
          success: false,
          error: `Sản phẩm "${product.title}" không đủ tồn kho (yêu cầu ${validQuantity}, hiện còn ${reservedItems.length}).`
        };
      }
    }

    // Trừ tiền ví qua Ledger (Step 2)
    const ledgerRes = await LedgerService.executeTransaction({
      userId: buyer.id,
      type: 'PURCHASE_INSTANT',
      amount: -price,
      description: `Mua lẻ: ${product.title} (x${validQuantity})`,
      referenceId: orderId,
      ipAddress
    });

    if (!ledgerRes.success) {
      for (const item of reservedItems) {
        InventoryService.releaseReservation(item.id);
      }
      return { success: false, error: ledgerRes.error || 'Trừ tiền ví thất bại' };
    }

    // Step 3: Giao hàng
    if (reservedItems.length > 0) {
      for (const item of reservedItems) {
        InventoryService.markDelivered(item.id);
        if (item.keyCode) {
          deliveredKeys.push(item.keyCode);
        }
      }
      deliveredKey = deliveredKeys.join('\n');
    } else if (isSupplierProduct) {
      // Gọi nhà cung cấp
      try {
        const supplierDispatch = await SupplierManagerService.dispatchSupplierOrder({
          localProductId: productId,
          quantity: validQuantity,
          localOrderId: orderId,
          customerPrice: price
        });

        if (supplierDispatch.isSupplierProduct) {
          if (!supplierDispatch.success || !supplierDispatch.deliveredKey) {
            // Hoàn tiền lại ví
            await LedgerService.executeTransaction({
              userId: buyer.id,
              type: 'REFUND',
              amount: price,
              description: `Hoàn tiền đơn ${orderId}: Nhà cung cấp không thể giao hàng`,
              referenceId: `REFUND-${orderId}`
            });
            return {
              success: false,
              error: supplierDispatch.error || 'Nhà cung cấp không thể giao hàng vào thời điểm này. Đã hoàn tiền về ví của bạn.'
            };
          }
          deliveredKey = supplierDispatch.deliveredKey;
          deliveredKeys = [deliveredKey];
          supplierOrderInfo = supplierDispatch.supplierOrderSnapshot;
        }
      } catch (err: any) {
        // Hoàn tiền
        await LedgerService.executeTransaction({
          userId: buyer.id,
          type: 'REFUND',
          amount: price,
          description: `Hoàn tiền đơn ${orderId}: Lỗi kết nối nhà cung cấp`,
          referenceId: `REFUND-${orderId}`
        });
        return {
          success: false,
          error: `Lỗi kết nối nhà cung cấp: ${err.message || 'Không thể giao hàng'}. Đã hoàn tiền về ví.`
        };
      }
    }

    // F04: CHẶN FALLBACK SINH HÀNG GIẢ KHI KHO HOẶC PROVIDER HẾT HÀNG
    if (!deliveredKey || deliveredKeys.length === 0) {
      // Hoàn tiền lại cho khách nếu đã trừ tiền
      await LedgerService.executeTransaction({
        userId: buyer.id,
        type: 'REFUND',
        amount: price,
        description: `Hoàn tiền đơn ${orderId}: Kho không có sẵn mã bản quyền`,
        referenceId: `REFUND-${orderId}`
      });
      return {
        success: false,
        error: `Sản phẩm "${product.title}" hiện tại không có sẵn hàng trong kho. Đã hoàn tiền về ví của bạn!`
      };
    }

    // Determine branch
    let branch: DeliveryBranch = (product as any).deliveryBranch || detectDeliveryBranch({
      title: product.title,
      description: product.description,
      category: product.category
    });

    const trimmed = deliveredKey.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      branch = 'LINK';
    } else if (trimmed.includes(':') && !trimmed.includes('http')) {
      branch = 'ACCOUNT';
    }

    const parsedOutput = parseDeliveredOutput(deliveredKey, branch);

    // 3. Create real fulfilled Order record in database
    const order: ServerOrder = {
      id: orderId,
      buyerId: buyer.id,
      productId: product.id,
      productTitle: validQuantity > 1 ? `${product.title} (x${validQuantity})` : product.title,
      orderType: 'INSTANT_KEY',
      status: 'COMPLETED',
      pricePaid: price,
      originalPrice: product.retailPrice * validQuantity,
      discountAmount: Math.max(0, (product.retailPrice * validQuantity) - price),
      deliveredData: {
        keys: deliveredKeys.length > 0 ? deliveredKeys : [deliveredKey],
        deliveryBranch: branch,
        accountCredentials: parsedOutput.accountCredentials,
        inviteLink: parsedOutput.inviteLink,
        cardCode: (parsedOutput as any).cardCode,
        pinCode: (parsedOutput as any).pinCode
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 32)}`
    };

    if (supplierOrderInfo) {
      (order as any).supplierOrderInfo = supplierOrderInfo;
    }

    // Store in real server memory/database
    db.orders.set(order.id, order);

    // Reduce product stock in database
    if (product.stockAvailable !== undefined && product.stockAvailable > 0) {
      product.stockAvailable = Math.max(0, product.stockAvailable - validQuantity);
    }

    AuditService.log({
      actorId: buyer.id,
      actorName: buyer.name,
      actorRole: buyer.role,
      action: 'ORDER_INSTANT_PURCHASE',
      resource: 'ORDER',
      resourceId: order.id,
      newValue: { productId, pricePaid: price, keyDelivered: true, paymentMethod },
      ipAddress
    });

    return { 
      success: true, 
      order, 
      deliveredKey 
    };
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
      return { success: false, error: 'Không tìm thấy thông tin game' };
    }

    const tier = game.tiers?.find((t: any) => t.id === tierId || t.name === tierId);
    if (!tier) {
      return { success: false, error: 'Gói nạp game không tồn tại' };
    }

    // F15: Khắc phục lỗi NaN khi tier dùng retailPrice thay vì price
    const price = Number(tier.retailPrice ?? tier.price ?? tier.retail_price ?? 0);
    if (!price || isNaN(price) || price <= 0) {
      return { success: false, error: 'Giá gói nạp không hợp lệ hoặc chưa được cập nhật' };
    }

    if (buyer.walletBalance < price) {
      return { 
        success: false, 
        error: `Số dư ví không đủ để nạp. Cần: ${price.toLocaleString('vi-VN')}đ, Hiện có: ${buyer.walletBalance.toLocaleString('vi-VN')}đ` 
      };
    }

    const orderId = `ord-topup-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const gameTitle = game.name || game.title || 'Game';

    // Deduct via Ledger
    const ledgerRes = await LedgerService.executeTransaction({
      userId: buyer.id,
      type: 'TOPUP_GAME',
      amount: -price,
      description: `Nạp ${gameTitle} [${tier.name}] - UID: ${uid}`,
      referenceId: orderId,
      ipAddress
    });

    if (!ledgerRes.success) {
      return { success: false, error: ledgerRes.error || 'Trừ tiền ví nạp game thất bại' };
    }

    // F15: Trạng thái ban đầu là PROCESSING (chờ nhà cung cấp / đối soát xử lý), không giả lập COMPLETED tức thì
    const order: ServerOrder = {
      id: orderId,
      buyerId: buyer.id,
      gameId: game.id,
      productTitle: `${gameTitle} - ${tier.name}`,
      orderType: 'DIRECT_TOPUP',
      status: 'PROCESSING',
      pricePaid: price,
      originalPrice: tier.originalPrice || price,
      discountAmount: Math.max(0, (tier.originalPrice || price) - price),
      deliveredData: {
        topupUid: uid,
        topupServer: server || zoneId || 'Global',
        characterName: characterName || undefined,
        tierName: tier.name
      },
      createdAt: new Date().toISOString(),
      txHash: `TX-TOPUP-${Date.now()}`
    };

    db.orders.set(order.id, order);

    // Route to actual real source provider & account based on target game
    let targetProviderId = 'provider_genshin_api';
    let targetAccountId = 'acc_genshin_alpha';

    const gameLower = (game.id + ' ' + (gameTitle || '')).toLowerCase();
    if (gameLower.includes('genshin') || gameLower.includes('honkai') || gameLower.includes('star-rail') || gameLower.includes('hoyoverse')) {
      targetProviderId = 'provider_genshin_api';
      targetAccountId = 'acc_genshin_alpha';
    } else if (gameLower.includes('steam') || gameLower.includes('valve') || gameLower.includes('dota') || gameLower.includes('csgo') || gameLower.includes('cs2')) {
      targetProviderId = 'provider_steam_wallet';
      targetAccountId = 'acc_steam_usd';
    } else if (gameLower.includes('riot') || gameLower.includes('valorant') || gameLower.includes('league') || gameLower.includes('tft')) {
      targetProviderId = 'provider_riot_browser';
      targetAccountId = 'acc_riot_web01';
    } else {
      // Find any active real account with sufficient balance
      const realAccounts = Array.from(paymentStore.accounts.values()).filter(
        acc => acc.provider_id !== 'mock_game_topup_v1' && acc.status === 'ACTIVE'
      );
      if (realAccounts.length > 0) {
        realAccounts.sort((a, b) => b.available_balance - a.available_balance);
        targetProviderId = realAccounts[0].provider_id;
        targetAccountId = realAccounts[0].id;
      }
    }

    // Verify account exists and is operational
    const selectedAccount = paymentStore.accounts.get(targetAccountId);
    if (!selectedAccount || selectedAccount.status !== 'ACTIVE') {
      console.warn(`[OrderService] Real provider account ${targetAccountId} not active. Locating fallback active account...`);
      const fallback = Array.from(paymentStore.accounts.values()).find(
        acc => acc.provider_id !== 'mock_game_topup_v1' && acc.status === 'ACTIVE'
      );
      if (fallback) {
        targetProviderId = fallback.provider_id;
        targetAccountId = fallback.id;
      }
    }

    // F15: Chuyển giao sang hệ thống worker nạp tiền độc lập xử lý với cơ chế lock phân tán & routing
    const txId = `pay_topup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paymentTx: PaymentTransaction = {
      id: txId,
      idempotency_key: `IDEMP_${orderId}`,
      order_id: orderId,
      user_id: buyer.id,
      provider_id: targetProviderId,
      source_account_id: targetAccountId,
      amount: price,
      currency: 'VND',
      fee: 0,
      net_amount: price,
      recipient: `UID_${uid}${server ? `_SRV_${server}` : ''}`,
      status: 'QUEUED',
      request_payload_hash: crypto.createHash('sha256').update(`${orderId}:${uid}:${price}`).digest('hex'),
      attempt_count: 0,
      max_attempts: 5,
      trace_id: `trace_${orderId}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    paymentStore.transactions.set(txId, paymentTx);
    paymentStore.idempotencyIndex.set(paymentTx.idempotency_key, txId);
    paymentWorkerService.enqueue(txId);

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
