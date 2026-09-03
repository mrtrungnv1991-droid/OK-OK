// ==============================================================================
// CYBERPOOL: RECONCILIATION WORKER (AT-LEAST-ONCE & DE-DUPLICATION ENGINE)
// ==============================================================================

import { ReliableOrder, SourceTransaction } from './types';
import { orderLock } from './distributedLock';
import { keyVault } from './keyVaultService';
import { OrderStateMachine } from './stateMachine';

export interface ReconciliationResult {
  order_id: string;
  matched: boolean;
  source_transaction_id?: string;
  action_taken: 'CONFIRMED_AND_SECURED' | 'KEPT_UNKNOWN_WAITING' | 'ESCALATED_MANUAL_REVIEW' | 'LOCKED_BY_OTHER_WORKER';
  details: string;
}

export class PurchaseReconciliationWorker {
  private static instance: PurchaseReconciliationWorker;
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  // Mocked source provider historical transactions store (in real production: scraped/API queried from Muakey, DivineShop, etc.)
  private mockSourceTransactions: Map<string, SourceTransaction[]> = new Map();

  private constructor() {
    this.seedMockSourceHistory();
  }

  public static getInstance(): PurchaseReconciliationWorker {
    if (!PurchaseReconciliationWorker.instance) {
      PurchaseReconciliationWorker.instance = new PurchaseReconciliationWorker();
    }
    return PurchaseReconciliationWorker.instance;
  }

  /**
   * Start scheduled reconciliation worker (every 30-60s)
   */
  public startScheduler(
    intervalMs: number = 30000,
    getUnknownOrders: () => ReliableOrder[],
    updateOrder: (order: ReliableOrder, eventType: string, metadata: Record<string, any>) => void,
    deliverOrder: (order: ReliableOrder) => Promise<void>
  ) {
    if (this.intervalTimer) clearInterval(this.intervalTimer);

    this.intervalTimer = setInterval(async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      try {
        const unknownOrders = getUnknownOrders().filter(
          o => o.status === 'PURCHASE_UNKNOWN' || o.status === 'PURCHASE_RECONCILING'
        );

        for (const order of unknownOrders) {
          await this.reconcileSingleOrder(order, updateOrder, deliverOrder);
        }
      } catch (err) {
        console.error('Lỗi trong Reconciliation Worker loop:', err);
      } finally {
        this.isRunning = false;
      }
    }, intervalMs);
  }

  public stopScheduler() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Reconciles a single order in PURCHASE_UNKNOWN or PURCHASE_RECONCILING
   */
  public async reconcileSingleOrder(
    order: ReliableOrder,
    updateOrder: (order: ReliableOrder, eventType: string, metadata: Record<string, any>) => void,
    deliverOrder: (order: ReliableOrder) => Promise<void>
  ): Promise<ReconciliationResult> {
    const workerId = `reconciler-${process.pid || '101'}`;

    // STEP 1: ACQUIRE DISTRIBUTED LOCK
    const lockResult = orderLock.acquireLock(order.id, workerId, 60);
    if (!lockResult.acquired) {
      return {
        order_id: order.id,
        matched: false,
        action_taken: 'LOCKED_BY_OTHER_WORKER',
        details: lockResult.message
      };
    }

    try {
      order.status = 'PURCHASE_RECONCILING';
      order.reconciliation_count += 1;
      order.updated_at = new Date().toISOString();

      updateOrder(order, 'RECONCILIATION_STARTED', {
        attempt_number: order.reconciliation_count,
        worker_id: workerId,
        strategy: 'QUERY_SOURCE_TRANSACTION_HISTORY'
      });

      // STEP 2: QUERY SOURCE TRANSACTION HISTORY
      const sourceHistory = this.getSourceHistory(order.source_provider);

      // STEP 3: MATCHING RULES:
      // Match by order_hash, or product title + amount within time window
      const matchedTx = sourceHistory.find(tx => {
        if (tx.order_hash && tx.order_hash === order.order_hash) return true;
        if (tx.order_id === order.id) return true;
        const amountMatch = Math.abs(tx.amount - order.source_estimated_cost) < 1000;
        const productMatch = tx.product_name.toLowerCase().includes(order.product_title.toLowerCase().substring(0, 10));
        return amountMatch && productMatch;
      });

      // STEP 4: IF TRANSACTION FOUND ON SOURCE:
      if (matchedTx) {
        order.source_transaction_id = matchedTx.id;
        order.status = 'PURCHASE_CONFIRMED';
        order.last_error = undefined;
        order.failure_reason = undefined;
        order.updated_at = new Date().toISOString();

        updateOrder(order, 'SOURCE_PURCHASE_CONFIRMED', {
          source_transaction_id: matchedTx.id,
          matched_amount: matchedTx.amount,
          provider: order.source_provider
        });

        // Acquire and store key in Key Vault
        const rawKey = matchedTx.raw_data?.key || `MKY-RECONCILED-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        keyVault.saveKeyToVault({
          order_id: order.id,
          customer_id: order.customer_id,
          provider: order.source_provider,
          source_transaction_id: matchedTx.id,
          product_id: order.product_id,
          raw_key_payload: `Mã Bản Quyền: ${rawKey}\nKích hoạt tại: ${order.source_provider}`
        });

        order.status = 'KEY_SECURED';
        order.updated_at = new Date().toISOString();

        updateOrder(order, 'KEY_SECURED', {
          key_secured: true,
          encryption: 'AES-256-CBC'
        });

        // Trigger safe Delivery Worker
        await deliverOrder(order);

        return {
          order_id: order.id,
          matched: true,
          source_transaction_id: matchedTx.id,
          action_taken: 'CONFIRMED_AND_SECURED',
          details: `Tìm thấy giao dịch gốc ${matchedTx.id} trên ${order.source_provider}. Đã khôi phục và lưu an toàn vào Key Vault!`
        };
      }

      // STEP 5: IF NOT FOUND ON SOURCE
      if (order.reconciliation_count >= order.max_reconciliation_attempts) {
        // Exceeded max attempts -> Escalate to MANUAL_REVIEW
        order.status = 'MANUAL_REVIEW';
        order.failure_reason = `Đã đối soát ${order.reconciliation_count}/${order.max_reconciliation_attempts} lần trên ${order.source_provider} nhưng không tìm thấy giao dịch. Chuyển sang can thiệp thủ công.`;
        order.updated_at = new Date().toISOString();

        updateOrder(order, 'ESCALATED_MANUAL_REVIEW', {
          reason: order.failure_reason,
          reconciliation_attempts: order.reconciliation_count
        });

        return {
          order_id: order.id,
          matched: false,
          action_taken: 'ESCALATED_MANUAL_REVIEW',
          details: order.failure_reason
        };
      } else {
        // Still has attempts left -> Keep in PURCHASE_UNKNOWN and wait for next interval
        order.status = 'PURCHASE_UNKNOWN';
        order.updated_at = new Date().toISOString();

        updateOrder(order, 'PURCHASE_UNKNOWN_FLAGGED', {
          attempt: order.reconciliation_count,
          max_attempts: order.max_reconciliation_attempts,
          message: 'Chưa thấy giao dịch trên source. Chờ chu kỳ đối soát tiếp theo.'
        });

        return {
          order_id: order.id,
          matched: false,
          action_taken: 'KEPT_UNKNOWN_WAITING',
          details: `Chưa tìm thấy trên ${order.source_provider}. Lần thử ${order.reconciliation_count}/${order.max_reconciliation_attempts}. Tiếp tục giữ ở PURCHASE_UNKNOWN.`
        };
      }
    } finally {
      // ALWAYS RELEASE DISTRIBUTED LOCK
      orderLock.releaseLock(order.id, workerId);
    }
  }

  /**
   * Helper to seed / simulate source transaction history
   */
  public addMockSourceTransaction(provider: string, tx: SourceTransaction) {
    const list = this.mockSourceTransactions.get(provider) || [];
    list.unshift(tx);
    this.mockSourceTransactions.set(provider, list);
  }

  public getSourceHistory(provider: string): SourceTransaction[] {
    return this.mockSourceTransactions.get(provider) || [];
  }

  private seedMockSourceHistory() {
    this.mockSourceTransactions.set('Muakey.com', [
      {
        id: 'MK-5518291',
        order_id: 'CP-88219',
        order_hash: 'CP-MKY-88219',
        provider: 'Muakey.com',
        amount: 300000,
        currency: 'VND',
        status: 'CONFIRMED',
        product_name: 'YouTube Premium 1 Năm (Nâng cấp chính chủ)',
        account_identity: 'reseller_cyberpool@gmail.com',
        created_at: new Date(Date.now() - 300000).toISOString(),
        raw_data: {
          key: 'MKY-YTB-9821-PREM-OK',
          claim_url: 'https://muakey.com/claim/5518291'
        }
      },
      {
        id: 'MK-5519002',
        order_id: 'CP-88220',
        order_hash: 'CP-MKY-88220',
        provider: 'Muakey.com',
        amount: 75000,
        currency: 'VND',
        status: 'CONFIRMED',
        product_name: 'Canva Pro Edu 1 Năm bản quyền',
        account_identity: 'reseller_cyberpool@gmail.com',
        created_at: new Date(Date.now() - 120000).toISOString(),
        raw_data: {
          invite_link: 'https://canva.com/brand/join?token=mky88a91c'
        }
      }
    ]);
  }
}

export const reconciliationWorker = PurchaseReconciliationWorker.getInstance();
