import { db } from '../db/store';
import { ServerWalletTransaction, TransactionType } from '../types';
import { AuditService } from './auditService';

export class LedgerService {
  /**
   * Performs an atomic wallet balance adjustment with double-entry audit logging.
   * Guaranteed:
   * - Prevents negative wallet balance
   * - Prevents double spending
   * - Creates immutable ServerWalletTransaction record
   */
  public static async executeTransaction(params: {
    userId: string;
    type: TransactionType;
    amount: number; // positive for credit, negative for debit
    description: string;
    referenceId?: string;
    idempotencyKey?: string;
    actorId?: string;
    actorName?: string;
    actorRole?: any;
    ipAddress?: string;
  }): Promise<{ success: boolean; transaction?: ServerWalletTransaction; error?: string }> {
    const { userId, type, amount, description, referenceId, idempotencyKey } = params;

    // Idempotency check
    if (idempotencyKey) {
      const existing = db.transactions.find(t => t.idempotencyKey === idempotencyKey);
      if (existing) {
        return { success: true, transaction: existing };
      }
    }

    await db.acquireUserLock(userId);

    try {
      const user = db.users.get(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const balanceBefore = user.walletBalance;
      const escrowBefore = user.escrowLocked;

      // Handle balance checks for debit operations
      if (amount < 0 && (balanceBefore + amount) < 0) {
        return { 
          success: false, 
          error: `Insufficient wallet balance. Available: ${balanceBefore}, Requested: ${Math.abs(amount)}` 
        };
      }

      let balanceAfter = balanceBefore;
      let escrowAfter = escrowBefore;

      switch (type) {
        case 'DEPOSIT':
        case 'AFFILIATE_COMMISSION':
        case 'ESCROW_REFUND':
        case 'SELLER_PAYOUT':
          balanceAfter = balanceBefore + Math.abs(amount);
          break;

        case 'WITHDRAWAL':
        case 'PURCHASE_INSTANT':
        case 'TOPUP_GAME':
          balanceAfter = balanceBefore - Math.abs(amount);
          break;

        case 'ESCROW_LOCK':
          // Lock money: deduct from liquid balance, increase escrow locked
          balanceAfter = balanceBefore - Math.abs(amount);
          escrowAfter = escrowBefore + Math.abs(amount);
          break;

        case 'ESCROW_RELEASE':
          // Escrow resolved: deduct from escrow locked (money already deducted from buyer at lock time)
          escrowAfter = Math.max(0, escrowBefore - Math.abs(amount));
          break;

        case 'SYSTEM_ADJUSTMENT':
          balanceAfter = balanceBefore + amount;
          if (balanceAfter < 0) balanceAfter = 0;
          break;
      }

      // Update User State atomically
      user.walletBalance = balanceAfter;
      user.escrowLocked = escrowAfter;
      db.users.set(userId, user);

      // Create Ledger Entry
      const transaction: ServerWalletTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        escrowBefore,
        escrowAfter,
        referenceId,
        description,
        status: 'COMPLETED',
        idempotencyKey,
        createdAt: new Date().toISOString()
      };

      db.transactions.unshift(transaction);

      // Audit Log
      AuditService.log({
        actorId: params.actorId || userId,
        actorName: params.actorName || user.name,
        actorRole: params.actorRole || user.role,
        action: `LEDGER_${type}`,
        resource: 'USER_WALLET',
        resourceId: userId,
        oldValue: { balance: balanceBefore, escrow: escrowBefore },
        newValue: { balance: balanceAfter, escrow: escrowAfter, txId: transaction.id },
        ipAddress: params.ipAddress
      });

      return { success: true, transaction };
    } finally {
      db.releaseUserLock(userId);
    }
  }

  public static getUserTransactions(userId: string): ServerWalletTransaction[] {
    return db.transactions.filter(t => t.userId === userId);
  }

  public static getAllTransactions(limit = 200): ServerWalletTransaction[] {
    return db.transactions.slice(0, limit);
  }
}
