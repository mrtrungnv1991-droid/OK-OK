// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - WORKERS & ORCHESTRATION ENGINE
// Conforms strictly to Sections 3.2, 12, 16, 17, 18, 20, 24, 33, 34, 63, 64 of Specification
// ==============================================================================

import {
  PaymentTransaction,
  SourceAccount,
  PaymentAttempt,
  ProviderTransactionResult
} from './types';
import { paymentStore } from './store';
import { lockManager } from './locking';
import { balanceReservationEngine } from './reservationEngine';
import { routingEngine } from './routingEngine';
import { paymentStateMachine } from './stateMachine';
import { circuitBreaker } from './circuitBreaker';
import { redactSensitive, generateTraceId } from './security';
import {
  SourceAdapter,
  MockProviderAdapter,
  ApiSourceAdapter,
  BrowserSourceAdapter
} from './adapters/base';

export class PaymentWorkerService {
  private workerId: string = `worker_${process.pid}_${Math.floor(Math.random() * 1000)}`;
  private isProcessingQueue: boolean = false;
  private queue: string[] = []; // transaction ids
  private adapters: Map<string, SourceAdapter> = new Map();
  private mockAdapter: MockProviderAdapter;

  constructor() {
    this.mockAdapter = new MockProviderAdapter('mock_game_topup_v1');
    this.adapters.set('mock_game_topup_v1', this.mockAdapter);
    this.adapters.set('provider_genshin_api', new ApiSourceAdapter('provider_genshin_api'));
    this.adapters.set('provider_steam_wallet', new ApiSourceAdapter('provider_steam_wallet'));
    this.adapters.set('provider_riot_browser', new BrowserSourceAdapter('provider_riot_browser'));

    // Start background loops
    this.startBackgroundLoops();
  }

  public getMockAdapter(): MockProviderAdapter {
    return this.mockAdapter;
  }

  public getAdapter(providerId: string): SourceAdapter {
    let adapter = this.adapters.get(providerId);
    if (!adapter) {
      adapter = new ApiSourceAdapter(providerId);
      this.adapters.set(providerId, adapter);
    }
    return adapter;
  }

  /**
   * Enqueue transaction for processing
   */
  public enqueue(transactionId: string): void {
    if (!this.queue.includes(transactionId)) {
      this.queue.push(transactionId);
    }
    this.processNextInQueue();
  }

  /**
   * Main Payment Worker Loop
   */
  private async processNextInQueue(): Promise<void> {
    if (this.isProcessingQueue || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const txId = this.queue.shift();

    if (!txId) {
      this.isProcessingQueue = false;
      return;
    }

    try {
      await this.processTransaction(txId);
    } catch (err: any) {
      console.error(`[PaymentWorker] Unhandled error processing transaction ${txId}:`, err);
    } finally {
      this.isProcessingQueue = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processNextInQueue(), 50);
      }
    }
  }

  /**
   * Process a single payment transaction according to specification
   */
  public async processTransaction(transactionId: string): Promise<void> {
    const tx = paymentStore.transactions.get(transactionId);
    if (!tx) return;

    // Terminal states cannot be processed
    if (tx.status === 'SUCCESS' || tx.status === 'CANCELLED') {
      return;
    }

    // Step 1: Acquire distributed transaction lock (Section 12, TTL 60s)
    const lockAcquired = lockManager.acquireTransactionLock(tx.id, this.workerId, paymentStore.systemConfig.payment_lock_ttl_seconds);
    if (!lockAcquired) {
      // Requeue with backoff if another worker holds lock
      setTimeout(() => this.enqueue(tx.id), 2000);
      return;
    }

    try {
      // Step 2: Routing Engine - Select candidate account (Section 14, 15)
      const allAccounts = Array.from(paymentStore.accounts.values());
      const routingResult = routingEngine.selectAccount(tx, allAccounts);

      if (!routingResult.selectedAccount) {
        tx.status = 'WAITING_FOR_BALANCE';
        tx.last_error_code = 'NO_ELIGIBLE_ACCOUNT';
        tx.last_error_message = `No active account with sufficient balance for provider ${tx.provider_id}. Evaluated: ${routingResult.evaluatedCandidatesCount}.`;
        tx.updated_at = new Date().toISOString();

        paymentStore.logAudit({
          who: this.workerId,
          what: 'ROUTING_FAILED_WAITING_FOR_BALANCE',
          resource: 'PAYMENT',
          resource_id: tx.id,
          after: { status: tx.status, reason: tx.last_error_message },
          ip: '127.0.0.1',
          trace_id: tx.trace_id,
          notes: 'Transaction paused until balance available or manually reviewed'
        });
        return;
      }

      const account = routingResult.selectedAccount;

      // Step 3: Account Concurrency Lock (Section 13: 1 account = 1 active tx by default)
      const slotAcquired = lockManager.acquireAccountSlot(account.id, tx.id, account.concurrency_limit);
      if (!slotAcquired) {
        // Concurrency limit reached on best account, requeue
        setTimeout(() => this.enqueue(tx.id), 1500);
        return;
      }

      try {
        // Step 4: Balance Reservation (Section 7, 20: anti-over-spending)
        const reserveResult = balanceReservationEngine.reserveBalance(account, tx.amount, tx.id);
        if (!reserveResult.success) {
          tx.status = 'WAITING_FOR_BALANCE';
          tx.last_error_code = 'RESERVATION_FAILED';
          tx.last_error_message = reserveResult.reason;
          tx.updated_at = new Date().toISOString();
          return;
        }

        // Transition to RESERVED -> PROCESSING
        tx.source_account_id = account.id;
        tx.status = 'PROCESSING';
        tx.processing_at = new Date().toISOString();
        tx.updated_at = new Date().toISOString();

        paymentStore.logAudit({
          who: this.workerId,
          what: 'BALANCE_RESERVED_AND_PROCESSING',
          resource: 'PAYMENT',
          resource_id: tx.id,
          before: { available: reserveResult.availableBefore },
          after: { available: reserveResult.availableAfter, accountId: account.id, amount: tx.amount },
          ip: '127.0.0.1',
          trace_id: tx.trace_id,
          notes: `Reserved ${tx.amount} ${tx.currency} on ${account.display_name}`
        });

        // Step 5: Execute Adapter Call
        tx.attempt_count += 1;
        const attemptId = `att_${Date.now()}_${tx.attempt_count}`;
        const attempt: PaymentAttempt = {
          id: attemptId,
          payment_transaction_id: tx.id,
          source_account_id: account.id,
          attempt_number: tx.attempt_count,
          request_id: `req_${tx.id}_${tx.attempt_count}`,
          status: 'STARTED',
          request_started_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        paymentStore.attempts.push(attempt);

        const adapter = this.getAdapter(tx.provider_id);
        const result = await adapter.createTopup(account, tx);

        attempt.request_finished_at = new Date().toISOString();
        attempt.external_transaction_id = result.external_id;
        attempt.raw_response_redacted = redactSensitive(JSON.stringify(result));

        // Step 6: Evaluate Result
        if (result.status === 'SUCCESS' && result.external_id) {
          // Success Path: Settle reservation & finalize
          balanceReservationEngine.settleReservation(account, tx.id);
          tx.status = 'SUCCESS';
          tx.external_transaction_id = result.external_id;
          tx.external_reference = result.raw_reference;
          tx.completed_at = new Date().toISOString();
          tx.updated_at = new Date().toISOString();

          // Map external ID in index
          paymentStore.externalRefIndex.set(`${tx.provider_id}:${result.external_id}`, tx.id);

          // Circuit breaker record success
          circuitBreaker.recordSuccess(tx.provider_id);

          attempt.status = 'SUCCESS';

          paymentStore.logAudit({
            who: this.workerId,
            what: 'TRANSACTION_SUCCESS',
            resource: 'PAYMENT',
            resource_id: tx.id,
            after: { status: 'SUCCESS', externalId: result.external_id, settledAmount: tx.amount },
            ip: '127.0.0.1',
            trace_id: tx.trace_id,
            notes: `Successfully delivered to recipient ${tx.recipient}`
          });

        } else if (result.status === 'UNKNOWN') {
          // Section 18: UNKNOWN transaction - NEVER recreate transaction immediately!
          attempt.status = 'UNKNOWN';
          attempt.error_code = result.error_code || 'EXTERNAL_TRANSACTION_UNKNOWN';
          attempt.error_message = result.message;

          tx.status = 'UNKNOWN';
          tx.last_error_code = result.error_code || 'EXTERNAL_TRANSACTION_UNKNOWN';
          tx.last_error_message = result.message || 'External status is indeterminate. Verification in progress.';
          tx.updated_at = new Date().toISOString();

          // Trigger immediate status query attempt
          const queryResult = await adapter.getTransactionStatus(account, tx);
          if (queryResult.status === 'SUCCESS' && queryResult.external_id) {
            balanceReservationEngine.settleReservation(account, tx.id);
            tx.status = 'SUCCESS';
            tx.external_transaction_id = queryResult.external_id;
            tx.completed_at = new Date().toISOString();
            tx.updated_at = new Date().toISOString();
          } else {
            // Escalate to MANUAL_REVIEW if not resolved
            tx.status = 'MANUAL_REVIEW';
            paymentStore.dlq.set(tx.id, {
              id: `dlq_${Date.now()}`,
              payment_id: tx.id,
              reason: 'UNKNOWN status after provider timeout. Manual check required.',
              failed_attempts: tx.attempt_count,
              last_error_code: tx.last_error_code,
              last_error_message: tx.last_error_message,
              queued_at: new Date().toISOString()
            });
          }

        } else {
          // Failure Path
          attempt.status = 'FAILED';
          attempt.error_code = result.error_code || 'EXTERNAL_TRANSACTION_FAILED';
          attempt.error_message = result.message;

          // Release reservation on this account
          balanceReservationEngine.releaseReservation(account, tx.id);

          // Increment error count on account
          account.error_count += 1;
          account.last_error_at = new Date().toISOString();

          // Check if retryable (Section 16, 17)
          const isRetryable = result.is_retryable || paymentStateMachine.isRetryableError(result.error_code);

          if (isRetryable && tx.attempt_count < tx.max_attempts) {
            tx.status = 'RETRY_WAIT';
            tx.last_error_code = result.error_code;
            tx.last_error_message = result.message;
            tx.updated_at = new Date().toISOString();

            // Circuit breaker failure increment
            circuitBreaker.recordFailure(tx.provider_id);

            // Put account into temporary cooldown if rate limited
            if (result.error_code === 'PROVIDER_RATE_LIMIT') {
              account.status = 'COOLDOWN';
              account.cooldown_until = new Date(Date.now() + 60000).toISOString();
            }

            const delayMs = paymentStateMachine.calculateRetryDelay(tx.attempt_count);
            setTimeout(() => this.enqueue(tx.id), delayMs);

            paymentStore.logAudit({
              who: this.workerId,
              what: 'RETRY_SCHEDULED',
              resource: 'PAYMENT',
              resource_id: tx.id,
              after: { attempt: tx.attempt_count, max: tx.max_attempts, delayMs, error: result.error_code },
              ip: '127.0.0.1',
              trace_id: tx.trace_id,
              notes: `Retry scheduled in ${Math.round(delayMs / 1000)}s with exponential backoff`
            });

          } else {
            // Non-retryable or max attempts exhausted
            circuitBreaker.recordFailure(tx.provider_id);

            if (tx.attempt_count >= tx.max_attempts) {
              tx.status = 'MANUAL_REVIEW';
              paymentStore.dlq.set(tx.id, {
                id: `dlq_${Date.now()}`,
                payment_id: tx.id,
                reason: `Exhausted ${tx.max_attempts} attempts. Last error: ${result.error_code}`,
                failed_attempts: tx.attempt_count,
                last_error_code: result.error_code,
                last_error_message: result.message,
                queued_at: new Date().toISOString()
              });
            } else {
              tx.status = 'FAILED';
              tx.failed_at = new Date().toISOString();
            }

            tx.last_error_code = result.error_code;
            tx.last_error_message = result.message;
            tx.updated_at = new Date().toISOString();

            paymentStore.logAudit({
              who: this.workerId,
              what: tx.status === 'MANUAL_REVIEW' ? 'ESCALATED_TO_DLQ' : 'TRANSACTION_FAILED_FINAL',
              resource: 'PAYMENT',
              resource_id: tx.id,
              after: { status: tx.status, error: result.error_code, message: result.message },
              ip: '127.0.0.1',
              trace_id: tx.trace_id,
              notes: result.message
            });
          }
        }

      } finally {
        lockManager.releaseAccountSlot(account.id, tx.id);
      }

    } finally {
      lockManager.releaseTransactionLock(tx.id, this.workerId);
    }
  }

  /**
   * Periodic Background Loops:
   * - Balance Polling (Section 6.1)
   * - Reservation Expiry Cleanup (Section 63)
   * - Reconciliation Check (Section 33, 34)
   */
  private startBackgroundLoops(): void {
    // 1. Balance check worker (every 60 seconds)
    setInterval(async () => {
      try {
        const accounts = Array.from(paymentStore.accounts.values());
        for (const account of accounts) {
          if (account.status === 'ACTIVE' || account.status === 'LOW_BALANCE') {
            const adapter = this.getAdapter(account.provider_id);
            const res = await adapter.getBalance(account);
            account.balance = res.verifiedBalance;
            account.available_balance = account.balance - account.reserved_balance;
            account.last_balance_check = new Date().toISOString();

            // Auto-flag low balance
            if (account.available_balance < 500000 && account.status === 'ACTIVE') {
              account.status = 'LOW_BALANCE';
            } else if (account.available_balance >= 500000 && account.status === 'LOW_BALANCE') {
              account.status = 'ACTIVE';
            }
          }
        }
      } catch (e) {
        console.error('[BalanceWorker] Error in periodic polling:', e);
      }
    }, 60000);

    // 2. Reservation GC (clean stale reservations from crashed workers)
    setInterval(() => {
      try {
        balanceReservationEngine.cleanExpiredReservations(paymentStore.accounts);
      } catch (e) {
        console.error('[ReservationGC] Error cleaning expired reservations:', e);
      }
    }, 30000);

    // 3. Automated Reconciliation Worker (every 15 minutes / 900s or on demand)
    setInterval(() => {
      this.runReconciliation();
    }, 900000);
  }

  /**
   * Run full Reconciliation cross-check (Section 33, 34)
   */
  public runReconciliation(): {
    timestamp: string;
    checkedTransactions: number;
    checkedAccounts: number;
    discrepanciesFound: number;
    items: any[];
  } {
    const findings: any[] = [];
    const now = new Date().toISOString();

    // 1. Balance discrepancy check across all source accounts
    for (const [accId, acc] of paymentStore.accounts.entries()) {
      const calculatedAvailable = acc.balance - acc.reserved_balance;
      if (acc.available_balance !== calculatedAvailable) {
        const item = {
          id: `rec_bal_${Date.now()}_${accId}`,
          timestamp: now,
          type: 'BALANCE_MISMATCH' as const,
          account_id: accId,
          provider_id: acc.provider_id,
          expected_value: calculatedAvailable,
          actual_value: acc.available_balance,
          status: 'OPEN' as const,
          notes: `Internal available balance formula desync: ${acc.available_balance} vs ${calculatedAvailable}`
        };
        paymentStore.reconciliationItems.unshift(item);
        findings.push(item);
      }
    }

    // 2. Check for UNKNOWN transactions that were never finalized
    for (const [txId, tx] of paymentStore.transactions.entries()) {
      if (tx.status === 'UNKNOWN') {
        const item = {
          id: `rec_unk_${Date.now()}_${txId}`,
          timestamp: now,
          type: 'UNKNOWN_TX' as const,
          transaction_id: txId,
          provider_id: tx.provider_id,
          expected_value: 'FINAL_STATE (SUCCESS / FAILED)',
          actual_value: 'UNKNOWN',
          status: 'OPEN' as const,
          notes: `Transaction ${txId} remains in UNKNOWN state. Requires external provider status query.`
        };
        paymentStore.reconciliationItems.unshift(item);
        findings.push(item);
      }
    }

    return {
      timestamp: now,
      checkedTransactions: paymentStore.transactions.size,
      checkedAccounts: paymentStore.accounts.size,
      discrepanciesFound: findings.length,
      items: findings
    };
  }
}

export const paymentWorkerService = new PaymentWorkerService();
