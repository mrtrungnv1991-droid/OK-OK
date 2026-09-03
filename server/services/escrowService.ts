import { db } from '../db/store';
import { ServerEscrowContract, ServerOrder, ServerUser } from '../types';
import { LedgerService } from './ledgerService';
import { InventoryService } from './inventoryService';
import { AuditService } from './auditService';

export class EscrowService {
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

    // Step 1: Lock buyer funds via Ledger
    const ledgerResult = await LedgerService.executeTransaction({
      userId: user.id,
      type: 'ESCROW_LOCK',
      amount: -contract.pricePerSlot,
      description: `Khóa quỹ Escrow tham gia nhóm #${poolId} (${product.title})`,
      referenceId: contract.id,
      ipAddress
    });

    if (!ledgerResult.success) {
      return { success: false, error: ledgerResult.error || 'Failed to lock funds in Escrow' };
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

    // Step 3: Check completion / Quorum trigger
    if (isCompleted) {
      contract.status = 'COMPLETED';

      // Reserve & deliver item for each participant
      for (const pt of contract.participants) {
        const orderId = `ord-escrow-${contract.id}-${pt.slotNumber}`;
        const item = await InventoryService.reserveItem(productId, pt.userId, orderId);
        const deliveredKey = item?.keyCode || `CYBER-${product.platform.toUpperCase()}-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;

        if (item) {
          InventoryService.markDelivered(item.id);
        }
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
          txHash: `0x${Math.random().toString(16).substr(2, 32)}`
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
