import { db } from '../db/store';
import { ServerEscrowContract, ServerOrder, ServerUser } from '../types';
import { LedgerService } from './ledgerService';
import { InventoryService } from './inventoryService';
import { AuditService } from './auditService';

export class EscrowService {
  // CYBERPOOL FIX (race condition): per-pool in-process mutex. The old joinPool
  // checked `filledSlots < targetSlots`, then awaited a ledger lock, then
  // incremented — two concurrent requests could both pass the check and
  // oversell slots. Node is single-threaded so a simple Set of in-flight
  // poolIds closes the window (a caller that reaches the check while another
  // request for the same pool is mid-flight gets a busy failure).
  private static inFlightPools: Set<string> = new Set();

  /**
   * Joins an escrow group buy pool.
   * Atomic operations:
   * 1. Locks funds from user wallet (ESCROW_LOCK).
   * 2. Adds participant to contract.
   * 3. If targetSlots reached -> Dispatches keys, marks contract COMPLETED, creates orders, releases escrow hold.
   */
  public static async joinPool(params: {
    poolId: string;
    productId: string;
    user: ServerUser;
    ipAddress?: string;
  }): Promise<{ success: boolean; contract?: ServerEscrowContract; order?: ServerOrder; error?: string }> {
    const { poolId, productId, user, ipAddress } = params;

    let contract = db.escrowContracts.get(poolId);
    const product = db.products.find(p => p.id === productId);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    // If contract doesn't exist yet, create it from product pool config
    if (!contract) {
      const poolConfig = product.activePools?.find((p: any) => p.id === poolId);
      if (!poolConfig) {
        return { success: false, error: 'Pool configuration not found' };
      }

      contract = {
        id: `escrow-${poolId}`,
        productId,
        poolId,
        targetSlots: poolConfig.targetSlots,
        filledSlots: poolConfig.filledSlots,
        pricePerSlot: poolConfig.pricePerSlot,
        totalLockedAmount: poolConfig.filledSlots * poolConfig.pricePerSlot,
        status: 'FILLING',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        participants: poolConfig.participants || [],
        createdAt: new Date().toISOString()
      };
      db.escrowContracts.set(poolId, contract);
    }

    if (contract.status !== 'FILLING') {
      return { success: false, error: 'Escrow contract is no longer accepting participants' };
    }

    if (contract.filledSlots >= contract.targetSlots) {
          return { success: false, error: 'Escrow pool is already fully filled' };
        }

        // CYBERPOOL FIX (race condition): claim the per-pool mutex BEFORE any await.
        // The filledSlots check above is only safe when no other request is in the
        // middle of joining this same pool (check → ledger await → increment).
        if (EscrowService.inFlightPools.has(poolId)) {
          return { success: false, error: 'Escrow pool đang có giao dịch khác xử lý, vui lòng thử lại ngay.' };
        }
        EscrowService.inFlightPools.add(poolId);
        try {
          return await EscrowService.joinPoolLocked({ poolId, productId, user, ipAddress });
        } finally {
          EscrowService.inFlightPools.delete(poolId);
        }
      }

      private static async joinPoolLocked(params: {
        poolId: string;
        productId: string;
        user: ServerUser;
        ipAddress?: string;
      }): Promise<{ success: boolean; contract?: ServerEscrowContract; order?: ServerOrder; error?: string }> {
        const { poolId, productId, user, ipAddress } = params;

        let contract = db.escrowContracts.get(poolId);
                // CYBERPOOL FIX (P1 #2 — tiền): product phải lấy từ CONTRACT (đã lưu lúc
                // tạo pool), KHÔNG tin productId do client gửi. Trước đây code lấy product
                // theo client productId nhưng khóa tiền theo contract.pricePerSlot → có thể
                // dùng productId sản phẩm ĐẮT (500k) vào pool sản phẩm RẺ (1k): trả 1k,
                // nhận key sản phẩm 500k. Chặn mọi cặp poolId/productId không khớp.
                const product = db.products.find(p => p.id === contract?.productId);

                // CYBERPOOL FIX: re-validate SAU khi giành mutex, TRƯỚC khi khóa tiền —
                // trạng thái pool có thể đã đổi (COMPLETED/CANCELLED/full) giữa lúc
                // check ở joinPool() và lúc vào đây.
                if (!contract || !product) {
                  return { success: false, error: 'Pool hoặc sản phẩm không còn tồn tại' };
                }
                if (contract.productId !== productId) {
                  // Vẫn phòng thủ thêm cả lớp này (dù product đã lấy từ contract)
                  return { success: false, error: 'Sản phẩm không khớp với Pool này (poolId/productId không nhất quán).' };
                }
                if (contract.status !== 'FILLING' || contract.filledSlots >= contract.targetSlots) {
                  return { success: false, error: 'Escrow pool không còn nhận thêm thành viên' };
                }

        // CYBERPOOL FIX (CRITICAL — tiền): trước đây join pool KHÔNG trừ/khóa tiền
        // user (ESCROW_LOCK chỉ là case chết trong ledger, không ai gọi) → user nhận
        // key thật MIỄN PHÍ, và forceRefundPool "hoàn" số tiền chưa từng thu = tạo
        // tiền từ không khí. Giờ: KHÓA TIỀN TRƯỚC (ESCROW_LOCK: trừ walletBalance,
        // tăng escrowLocked), thất bại (không đủ số dư) thì từ chối join.
        const lockResult = await LedgerService.executeTransaction({
          userId: user.id,
          type: 'ESCROW_LOCK',
          amount: -contract.pricePerSlot,
          description: `Khóa tiền tham gia nhóm mua chung #${poolId}`,
          referenceId: contract.id,
          ipAddress
        });
        if (!lockResult.success) {
          return { success: false, error: lockResult.error || 'Không thể khóa tiền tham gia pool (số dư không đủ?)' };
        }

        // Step 2: Add participant
        const nextSlot = contract.filledSlots + 1;
    const isCompleted = nextSlot >= contract.targetSlots;

    const participantEntry = {
      userId: user.id,
      userName: user.name,
      avatar: user.avatar,
      joinedAt: new Date().toLocaleString('vi-VN'),
      slotNumber: nextSlot,
      deliveredKey: undefined as string | undefined
    };

    contract.participants.push(participantEntry);
    contract.filledSlots = nextSlot;
    contract.totalLockedAmount += contract.pricePerSlot;

    // Update Product activePool in catalog
    if (product.activePools) {
      const poolObj = product.activePools.find((p: any) => p.id === poolId);
      if (poolObj) {
        poolObj.filledSlots = nextSlot;
        poolObj.status = isCompleted ? 'completed' : 'filling';
        poolObj.participants = contract.participants;
      }
    }

    let completedOrder: ServerOrder | undefined;
        let allDelivered = true;

        // Step 3: Check completion / Quorum trigger
        if (isCompleted) {

          // Reserve & deliver item for each participant
                for (const pt of contract.participants) {
                  const orderId = `ord-escrow-${contract.id}-${pt.slotNumber}`;
                  const item = await InventoryService.reserveItem(productId, pt.userId, orderId);

                  // CYBERPOOL FIX (F04): never fabricate delivery keys/cards/hashes.
                  // If inventory has no real key, mark the slot as awaiting stock instead
                  // of handing the participant a fake "CYBER-...-AUTO" key.
                  if (!item) {
                    allDelivered = false;
                    pt.deliveredKey = undefined;
                    const blockedOrder: ServerOrder = {
                      id: orderId,
                      buyerId: pt.userId,
                      productId: product.id,
                      productTitle: product.title,
                      orderType: 'GROUP_POOL',
                      status: 'PENDING_STOCK',
                      pricePaid: contract.pricePerSlot,
                      originalPrice: product.retailPrice,
                      discountAmount: product.retailPrice - contract.pricePerSlot,
                      deliveredData: undefined,
                      escrowId: contract.id,
                      poolId,
                      createdAt: new Date().toISOString(),
                      txHash: ''
                    };
                    db.orders.set(blockedOrder.id, blockedOrder);
                    // CYBERPOOL FIX (P1 #7): giữ tiền KHÓA của slot này trong
                    // escrowLocked đúng như lúc join — không release, không COMPLETED.
                    continue;
                  }

              const deliveredKey = item.keyCode;
              InventoryService.markDelivered(item.id);
              pt.deliveredKey = deliveredKey;

              // Create fulfilled order
              const order: ServerOrder = {
                id: orderId,
                buyerId: pt.userId,
                productId: product.id,
                productTitle: product.title,
                orderType: 'GROUP_POOL',
                status: 'COMPLETED',
                pricePaid: contract.pricePerSlot,
                originalPrice: product.retailPrice,
                discountAmount: product.retailPrice - contract.pricePerSlot,
                deliveredData: {
                  keys: [deliveredKey],
                  giftUpCard: product.deliveryType === 'giftup_card' ? {
                    cardNumber: `4928 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
                    pinCode: '8821',
                    barcode: `GU-ESCROW-${Math.floor(1000 + Math.random() * 9000)}`
                  } : undefined
                },
                escrowId: contract.id,
                poolId,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                txHash: ''
              };

              db.orders.set(order.id, order);

        // Release locked funds from escrow accounting
        await LedgerService.executeTransaction({
          userId: pt.userId,
          type: 'ESCROW_RELEASE',
          amount: -contract.pricePerSlot,
          description: `Giải ngân Escrow thành công: Hoàn tất nhóm ${product.title}`,
          referenceId: order.id
        });

        if (pt.userId === user.id) {
          completedOrder = order;
        }
      }

      // CYBERPOOL FIX (P1 #7): chỉ đánh dấu COMPLETED khi MỌI slot đã giao key.
            // Còn slot PENDING_STOCK (thiếu kho) → contract ở trạng thái
            // AWAITING_STOCK để (a) UI admin thấy rõ cần nhập hàng/xử lý, (b)
            // forceRefundPool vẫn cho phép hoàn tiền đúng theo slot còn khóa.
            contract.status = allDelivered ? 'COMPLETED' : 'AWAITING_STOCK';

            AuditService.log({
              actorId: 'SYSTEM_ESCROW_ENGINE',
              actorName: 'Cyber Escrow Oracle',
              actorRole: 'SUPER_ADMIN',
              action: 'ESCROW_POOL_COMPLETED',
              resource: 'ESCROW_CONTRACT',
              resourceId: contract.id,
              newValue: { totalSlots: contract.targetSlots, totalDelivered: contract.participants.length, awaitingStock: !allDelivered }
            });
    }

    db.escrowContracts.set(poolId, contract);

    return {
      success: true,
      contract,
      order: completedOrder
    };
  }

  /**
   * Admin Force Refund on disputed or expired escrow pool
   */
  public static async forceRefundPool(poolId: string, adminId: string, adminName: string): Promise<boolean> {
      const contract = db.escrowContracts.get(poolId);
      // CYBERPOOL FIX (P1 #7): trước đây chỉ nhận FILLING → pool đủ slot nhưng
      // thiếu key (đang AWAITING_STOCK) không hoàn tiền được. Giờ chấp nhận cả
      // AWAITING_STOCK và chỉ hoàn đúng những slot CHƯA release (money còn bị khóa).
      if (!contract || (contract.status !== 'FILLING' && contract.status !== 'AWAITING_STOCK')) return false;

      contract.status = 'CANCELLED';

      // Refund per-participant, chỉ slot còn giữ tiền escrow (order chưa COMPLETED)
      for (const pt of contract.participants) {
        const orderId = `ord-escrow-${contract.id}-${pt.slotNumber}`;
        const order = db.orders.get(orderId);
        // Slot đã giao key → ESCROW_RELEASE đã chạy, escrowLocked đã về 0.
        // Hoàn thêm = tạo tiền từ không khí. Chỉ refund khi order:
        //   - PENDING_STOCK (đủ slot nhưng thiếu kho) → tiền vẫn khóa ✓ hoàn
        //   - không tồn tại (pool chưa đủ slot, FILLING) → tiền vẫn khóa ✓ hoàn
        //   - COMPLETED → đã release ✗ KHÔNG hoàn
        if (order && order.status === 'COMPLETED') continue;

        await LedgerService.executeTransaction({
          userId: pt.userId,
          type: 'ESCROW_REFUND',
          amount: contract.pricePerSlot,
          description: `Hoàn tiền Escrow nhóm #${poolId} (${order ? order.status : 'pool chưa đủ thành viên'})`,
          referenceId: contract.id,
          actorId: adminId,
          actorName: adminName,
          actorRole: 'SUPER_ADMIN'
        });

        if (order && order.status === 'PENDING_STOCK') {
          // Đóng order bị treo stock sau khi hoàn tiền
          order.status = 'CANCELLED' as any;
          db.orders.set(order.id, order);
        }
      }

      db.escrowContracts.set(poolId, contract);
      return true;
    }
}
