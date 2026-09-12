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
        const product = db.products.find(p => p.id === productId);

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

    // Step 3: Check completion / Quorum trigger
    if (isCompleted) {
      contract.status = 'COMPLETED';

      // Reserve & deliver item for each participant
            for (const pt of contract.participants) {
              const orderId = `ord-escrow-${contract.id}-${pt.slotNumber}`;
              const item = await InventoryService.reserveItem(productId, pt.userId, orderId);

              // CYBERPOOL FIX (F04): never fabricate delivery keys/cards/hashes.
              // If inventory has no real key, mark the slot as awaiting stock instead
              // of handing the participant a fake "CYBER-...-AUTO" key.
              if (!item) {
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
                continue; // keep funds locked; admin must restock or refund
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

      AuditService.log({
        actorId: 'SYSTEM_ESCROW_ENGINE',
        actorName: 'Cyber Escrow Oracle',
        actorRole: 'SUPER_ADMIN',
        action: 'ESCROW_POOL_COMPLETED',
        resource: 'ESCROW_CONTRACT',
        resourceId: contract.id,
        newValue: { totalSlots: contract.targetSlots, totalDelivered: contract.participants.length }
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
    if (!contract || contract.status !== 'FILLING') return false;

    contract.status = 'CANCELLED';

    // Refund every participant
    for (const pt of contract.participants) {
      await LedgerService.executeTransaction({
        userId: pt.userId,
        type: 'ESCROW_REFUND',
        amount: contract.pricePerSlot,
        description: `Hoàn tiền Escrow nhóm #${poolId} bị hủy bởi Quản Trị Viên`,
        referenceId: contract.id,
        actorId: adminId,
        actorName: adminName,
        actorRole: 'SUPER_ADMIN'
      });
    }

    db.escrowContracts.set(poolId, contract);
    return true;
  }
}
