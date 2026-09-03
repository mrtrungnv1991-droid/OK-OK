// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - EXPRESS API ROUTES
// Conforms strictly to Sections 11, 22, 23, 38, 39, 40, 41, 74, 95, 97
// ==============================================================================

import { Router, Request, Response } from 'express';
import { paymentStore } from '../../../services/paymentSystem/store';
import { paymentWorkerService } from '../../../services/paymentSystem/workers';
import { circuitBreaker } from '../../../services/paymentSystem/circuitBreaker';
import {
  generateTraceId,
  hashPayload,
  redactSensitive,
  encryptCredential
} from '../../../services/paymentSystem/security';
import { PaymentTransaction, SourceAccount, CurrencyCode } from '../../../services/paymentSystem/types';

export const paymentRouter = Router();

// ------------------------------------------------------------------------------
// 1. CREATE PAYMENT (Section 38, 11 - Idempotent)
// ------------------------------------------------------------------------------
paymentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      idempotency_key,
      order_id,
      user_id,
      provider_id,
      amount,
      currency = 'VND',
      recipient,
      metadata
    } = req.body;

    const traceId = generateTraceId();

    // Validation
    if (!idempotency_key || typeof idempotency_key !== 'string') {
      return res.status(400).json({
        error: {
          code: 'PAYMENT_INVALID',
          message: 'Missing or invalid required field: idempotency_key'
        }
      });
    }

    if (!provider_id || !amount || !recipient) {
      return res.status(400).json({
        error: {
          code: 'PAYMENT_INVALID',
          message: 'Missing required fields: provider_id, amount, recipient'
        }
      });
    }

    const numericAmount = Math.round(Number(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: {
          code: 'PAYMENT_INVALID',
          message: 'Payment amount must be a positive integer minor unit.'
        }
      });
    }

    // SECTION 11 & 62: IDEMPOTENCY CHECK
    // If request with same idempotency_key exists -> return existing payment, NEVER recreate!
    const existingTxId = paymentStore.idempotencyIndex.get(idempotency_key);
    if (existingTxId) {
      const existingTx = paymentStore.transactions.get(existingTxId);
      if (existingTx) {
        return res.status(200).json({
          payment_id: existingTx.id,
          status: existingTx.status,
          amount: existingTx.amount,
          currency: existingTx.currency,
          idempotent_replay: true,
          trace_id: existingTx.trace_id,
          created_at: existingTx.created_at
        });
      }
    }

    // Check circuit breaker before creating
    const cbStatus = circuitBreaker.getCircuitStatus(provider_id);
    if (!cbStatus.canExecute) {
      return res.status(503).json({
        error: {
          code: 'PROVIDER_UNAVAILABLE',
          message: `Provider ${provider_id} circuit breaker is OPEN. Cooldown active.`
        }
      });
    }

    // Fixed fee calculation (Section 37)
    const fee = Math.round(numericAmount * 0.01); // 1% sample fixed fee
    const netAmount = numericAmount - fee;
    const txId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    const newTx: PaymentTransaction = {
      id: txId,
      idempotency_key,
      order_id: order_id || `ORD_${Date.now()}`,
      user_id: user_id || 'usr_anonymous',
      provider_id,
      amount: numericAmount,
      currency: currency as CurrencyCode,
      fee,
      net_amount: netAmount,
      recipient,
      status: 'QUEUED',
      request_payload_hash: hashPayload({ idempotency_key, provider_id, amount: numericAmount, recipient }),
      attempt_count: 0,
      max_attempts: paymentStore.systemConfig.default_max_attempts,
      trace_id: traceId,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store transaction & update idempotency index
    paymentStore.transactions.set(newTx.id, newTx);
    paymentStore.idempotencyIndex.set(idempotency_key, newTx.id);

    paymentStore.logAudit({
      who: 'PaymentGatewayAPI',
      what: 'PAYMENT_CREATED_QUEUED',
      resource: 'PAYMENT',
      resource_id: newTx.id,
      after: {
        idempotency_key,
        provider_id,
        amount: numericAmount,
        currency,
        recipient
      },
      ip: req.ip || '127.0.0.1',
      trace_id: traceId,
      notes: 'Payment transaction enqueued for background worker processing'
    });

    // Enqueue to background worker (Section 3.1)
    paymentWorkerService.enqueue(newTx.id);

    return res.status(201).json({
      payment_id: newTx.id,
      status: newTx.status,
      amount: newTx.amount,
      currency: newTx.currency,
      recipient: newTx.recipient,
      trace_id: newTx.trace_id,
      created_at: newTx.created_at
    });
  } catch (err: any) {
    console.error('[PaymentAPI] Create error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred while queuing the payment.'
      }
    });
  }
});

// ------------------------------------------------------------------------------
// 2. GET PAYMENT STATUS (Section 39 - Redacted)
// ------------------------------------------------------------------------------
paymentRouter.get('/:id', (req: Request, res: Response) => {
  const tx = paymentStore.transactions.get(req.params.id);
  if (!tx) {
    return res.status(404).json({
      error: {
        code: 'PAYMENT_NOT_FOUND',
        message: `Payment ${req.params.id} does not exist.`
      }
    });
  }

  // Safe response - NEVER return provider tokens, passwords or secrets
  return res.json({
    payment_id: tx.id,
    order_id: tx.order_id,
    provider_id: tx.provider_id,
    amount: tx.amount,
    currency: tx.currency,
    recipient: tx.recipient,
    status: tx.status,
    external_transaction_id: tx.external_transaction_id,
    attempt_count: tx.attempt_count,
    last_error_code: tx.last_error_code,
    last_error_message: tx.last_error_message,
    created_at: tx.created_at,
    completed_at: tx.completed_at
  });
});

// ------------------------------------------------------------------------------
// 3. CANCEL PAYMENT (Section 40 - Only when CREATED, QUEUED, RETRY_WAIT)
// ------------------------------------------------------------------------------
paymentRouter.post('/:id/cancel', (req: Request, res: Response) => {
  const tx = paymentStore.transactions.get(req.params.id);
  if (!tx) {
    return res.status(404).json({
      error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment does not exist.' }
    });
  }

  const cancelableStates = ['CREATED', 'QUEUED', 'RETRY_WAIT', 'WAITING_FOR_BALANCE'];
  if (!cancelableStates.includes(tx.status)) {
    return res.status(400).json({
      error: {
        code: 'CANNOT_CANCEL',
        message: `Transaction in ${tx.status} cannot be cancelled directly. It may be in processing or finalized.`
      }
    });
  }

  const beforeStatus = tx.status;
  tx.status = 'CANCELLED';
  tx.updated_at = new Date().toISOString();

  paymentStore.logAudit({
    who: 'ClientAPI / User',
    what: 'PAYMENT_CANCELLED',
    resource: 'PAYMENT',
    resource_id: tx.id,
    before: { status: beforeStatus },
    after: { status: 'CANCELLED' },
    ip: req.ip || '127.0.0.1',
    trace_id: tx.trace_id,
    notes: 'Payment explicitly cancelled prior to provider execution'
  });

  return res.json({
    payment_id: tx.id,
    status: 'CANCELLED',
    message: 'Payment has been successfully cancelled.'
  });
});

// ------------------------------------------------------------------------------
// 4. WEBHOOKS WITH REPLAY PROTECTION (Sections 22 & 23)
// ------------------------------------------------------------------------------
paymentRouter.post('/webhooks/provider/:providerId', (req: Request, res: Response) => {
  const { providerId } = req.params;
  const { event_id, external_transaction_id, status, amount, signature } = req.body;

  if (!event_id) {
    return res.status(400).json({ error: { code: 'INVALID_WEBHOOK', message: 'Missing event_id' } });
  }

  // Deduplication check: UNIQUE(provider_id, event_id)
  const webhookKey = `${providerId}:${event_id}`;
  if (paymentStore.webhookEvents.has(webhookKey)) {
    // Replay detected -> acknowledge HTTP 200 without duplicate processing
    return res.status(200).json({ status: 'IGNORED_DUPLICATE', event_id });
  }

  paymentStore.webhookEvents.set(webhookKey, {
    receivedAt: new Date().toISOString(),
    payloadHash: hashPayload(req.body)
  });

  // Find transaction by external reference
  const txId = paymentStore.externalRefIndex.get(`${providerId}:${external_transaction_id}`);
  if (txId) {
    const tx = paymentStore.transactions.get(txId);
    if (tx && tx.status !== 'SUCCESS') {
      if (status === 'SUCCESS' || status === 'COMPLETED') {
        tx.status = 'SUCCESS';
        tx.completed_at = new Date().toISOString();
        tx.updated_at = new Date().toISOString();
      }
    }
  }

  return res.status(200).json({ status: 'PROCESSED', event_id });
});

// ------------------------------------------------------------------------------
// 5. DEV & SIMULATOR TEST BENCH (Section 95: Simulation without real money)
// ------------------------------------------------------------------------------
paymentRouter.post('/dev/mock/simulate', async (req: Request, res: Response) => {
  try {
    const { scenario, latencyMs = 200 } = req.body;
    // Supported scenarios: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN' | 'RATE_LIMIT' | 'INSUFFICIENT_BALANCE' | 'SERVER_500'
    const mockAdapter = paymentWorkerService.getMockAdapter();
    mockAdapter.setForcedScenario(scenario);
    mockAdapter.setSimulatedLatency(latencyMs);

    return res.json({
      ok: true,
      message: `Mock Provider scenario set to: ${scenario || 'NORMAL_SUCCESS'}`,
      simulatedLatencyMs: latencyMs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ------------------------------------------------------------------------------
// 6. ADMIN APIS (Sections 41, 42, 43, 44, 45, 69)
// ------------------------------------------------------------------------------

// 6.1 Get Summary KPI & System Health
paymentRouter.get('/admin/system-health', (req: Request, res: Response) => {
  const accounts = Array.from(paymentStore.accounts.values());
  const transactions = Array.from(paymentStore.transactions.values());

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalReserved = accounts.reduce((acc, a) => acc + a.reserved_balance, 0);
  const totalAvailable = accounts.reduce((acc, a) => acc + a.available_balance, 0);

  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;
  const pausedAccounts = accounts.filter(a => a.status === 'PAUSED').length;
  const lowBalanceAccounts = accounts.filter(a => a.status === 'LOW_BALANCE').length;

  const totalTx = transactions.length;
  const successTx = transactions.filter(t => t.status === 'SUCCESS').length;
  const failedTx = transactions.filter(t => t.status === 'FAILED').length;
  const pendingTx = transactions.filter(t => t.status === 'PROCESSING' || t.status === 'QUEUED').length;
  const unknownTx = transactions.filter(t => t.status === 'UNKNOWN').length;
  const reviewTx = transactions.filter(t => t.status === 'MANUAL_REVIEW').length;

  const successRate = totalTx > 0 ? ((successTx / totalTx) * 100).toFixed(1) : '100';

  return res.json({
    live_mode: paymentStore.systemConfig.payment_live_mode,
    accounts_summary: {
      total: accounts.length,
      active: activeAccounts,
      paused: pausedAccounts,
      low_balance: lowBalanceAccounts,
      total_balance: totalBalance,
      total_reserved: totalReserved,
      total_available: totalAvailable
    },
    transactions_summary: {
      total: totalTx,
      success: successTx,
      failed: failedTx,
      pending: pendingTx,
      unknown: unknownTx,
      manual_review: reviewTx,
      success_rate: `${successRate}%`
    },
    providers: Array.from(paymentStore.providers.values()).map(p => {
      const cb = circuitBreaker.getCircuitStatus(p.provider_id);
      return {
        ...p,
        circuit_breaker_current: cb
      };
    }),
    dlq_count: paymentStore.dlq.size
  });
});

// 6.2 Source Accounts Management
paymentRouter.get('/admin/accounts', (req: Request, res: Response) => {
  const list = Array.from(paymentStore.accounts.values()).map(a => ({
    ...a,
    encrypted_credential: '[PROTECTED_AES256]' // Rule 27: never log or expose plaintext
  }));
  return res.json(list);
});

paymentRouter.post('/admin/accounts', (req: Request, res: Response) => {
  const {
    provider_id,
    external_account_id,
    username,
    display_name,
    currency = 'VND',
    balance = 0,
    daily_limit = 50000000,
    transaction_limit = 10000000,
    credential = '',
    auth_type = 'API_KEY'
  } = req.body;

  if (!provider_id || !username) {
    return res.status(400).json({ error: 'provider_id and username are required' });
  }

  const id = `acc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
  const numericBalance = Math.round(Number(balance));

  const newAccount: SourceAccount = {
    id,
    provider_id,
    external_account_id: external_account_id || `EXT_${id}`,
    username,
    display_name: display_name || username,
    currency,
    status: numericBalance < 500000 ? 'LOW_BALANCE' : 'ACTIVE',
    balance: numericBalance,
    available_balance: numericBalance,
    reserved_balance: 0,
    daily_limit: Number(daily_limit),
    transaction_limit: Number(transaction_limit),
    used_today: 0,
    last_balance_check: new Date().toISOString(),
    error_count: 0,
    concurrency_limit: 1,
    current_concurrent_jobs: 0,
    encrypted_credential: encryptCredential(credential || 'default_sec_token'),
    auth_type,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  paymentStore.accounts.set(newAccount.id, newAccount);

  paymentStore.logAudit({
    who: 'AdminUser',
    what: 'CREATE_SOURCE_ACCOUNT',
    resource: 'ACCOUNT',
    resource_id: newAccount.id,
    after: { username, provider_id, balance: numericBalance },
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId(),
    notes: `Added source account ${newAccount.display_name}`
  });

  return res.status(201).json({
    ...newAccount,
    encrypted_credential: '[PROTECTED_AES256]'
  });
});

paymentRouter.post('/admin/accounts/:id/pause', (req: Request, res: Response) => {
  const account = paymentStore.accounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  account.status = 'PAUSED';
  account.updated_at = new Date().toISOString();

  paymentStore.logAudit({
    who: 'AdminUser',
    what: 'PAUSE_SOURCE_ACCOUNT',
    resource: 'ACCOUNT',
    resource_id: account.id,
    after: { status: 'PAUSED' },
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId()
  });

  return res.json({ status: 'PAUSED', account_id: account.id });
});

paymentRouter.post('/admin/accounts/:id/resume', (req: Request, res: Response) => {
  const account = paymentStore.accounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  account.status = account.available_balance < 500000 ? 'LOW_BALANCE' : 'ACTIVE';
  account.cooldown_until = undefined;
  account.error_count = 0;
  account.updated_at = new Date().toISOString();

  paymentStore.logAudit({
    who: 'AdminUser',
    what: 'RESUME_SOURCE_ACCOUNT',
    resource: 'ACCOUNT',
    resource_id: account.id,
    after: { status: account.status },
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId()
  });

  return res.json({ status: account.status, account_id: account.id });
});

paymentRouter.post('/admin/accounts/:id/check-balance', async (req: Request, res: Response) => {
  const account = paymentStore.accounts.get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const adapter = paymentWorkerService.getAdapter(account.provider_id);
  const result = await adapter.getBalance(account);

  const prevBalance = account.balance;
  account.balance = result.verifiedBalance;
  account.available_balance = account.balance - account.reserved_balance;
  account.last_balance_check = new Date().toISOString();

  return res.json({
    account_id: account.id,
    verified_balance: account.balance,
    available_balance: account.available_balance,
    reserved_balance: account.reserved_balance,
    delta: account.balance - prevBalance,
    checked_at: account.last_balance_check
  });
});

// 6.3 Transactions & Manual Review (Section 55, 69)
paymentRouter.get('/admin/transactions', (req: Request, res: Response) => {
  const { status, provider_id, limit = 50 } = req.query;
  let list = Array.from(paymentStore.transactions.values());

  if (status) {
    list = list.filter(t => t.status === status);
  }
  if (provider_id) {
    list = list.filter(t => t.provider_id === provider_id);
  }

  list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return res.json(list.slice(0, Number(limit)));
});

paymentRouter.post('/admin/transactions/:id/review', (req: Request, res: Response) => {
  const { action, notes } = req.body; // action: 'MANUAL_SUCCESS' | 'MANUAL_FAIL'
  const tx = paymentStore.transactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  const beforeStatus = tx.status;

  if (action === 'MANUAL_SUCCESS') {
    tx.status = 'SUCCESS';
    tx.completed_at = new Date().toISOString();
    tx.external_transaction_id = tx.external_transaction_id || `MANUAL-${Date.now()}`;
  } else if (action === 'MANUAL_FAIL') {
    tx.status = 'FAILED';
    tx.failed_at = new Date().toISOString();
    // Release any lingering reservation
    if (tx.source_account_id) {
      const acc = paymentStore.accounts.get(tx.source_account_id);
      if (acc) {
        acc.reserved_balance = Math.max(0, acc.reserved_balance - tx.amount);
        acc.available_balance = acc.balance - acc.reserved_balance;
      }
    }
  } else {
    return res.status(400).json({ error: 'Invalid action. Must be MANUAL_SUCCESS or MANUAL_FAIL' });
  }

  tx.updated_at = new Date().toISOString();
  paymentStore.dlq.delete(tx.id);

  paymentStore.logAudit({
    who: 'AdminOperator',
    what: `ADMIN_FORCE_${action}`,
    resource: 'PAYMENT',
    resource_id: tx.id,
    before: { status: beforeStatus },
    after: { status: tx.status },
    ip: req.ip || '127.0.0.1',
    trace_id: tx.trace_id,
    notes: notes || 'Admin resolved review state manually'
  });

  return res.json({ payment_id: tx.id, status: tx.status });
});

paymentRouter.post('/admin/transactions/:id/retry', (req: Request, res: Response) => {
  const tx = paymentStore.transactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  tx.status = 'QUEUED';
  tx.attempt_count = 0; // reset attempts for explicit admin force retry
  tx.updated_at = new Date().toISOString();
  paymentStore.dlq.delete(tx.id);

  paymentStore.logAudit({
    who: 'AdminOperator',
    what: 'ADMIN_FORCE_RETRY',
    resource: 'PAYMENT',
    resource_id: tx.id,
    after: { status: 'QUEUED' },
    ip: req.ip || '127.0.0.1',
    trace_id: tx.trace_id,
    notes: 'Admin triggered explicit force retry'
  });

  paymentWorkerService.enqueue(tx.id);
  return res.json({ payment_id: tx.id, status: 'QUEUED' });
});

// 6.4 Circuit Breaker Reset
paymentRouter.post('/admin/providers/:id/reset-circuit', (req: Request, res: Response) => {
  circuitBreaker.resetCircuit(req.params.id);
  paymentStore.logAudit({
    who: 'AdminOperator',
    what: 'RESET_CIRCUIT_BREAKER',
    resource: 'PROVIDER',
    resource_id: req.params.id,
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId(),
    notes: `Admin manually reset circuit breaker for provider ${req.params.id}`
  });
  return res.json({ ok: true, provider_id: req.params.id, state: 'CLOSED' });
});

// 6.5 Reconciliation (Section 33, 34)
paymentRouter.get('/admin/reconciliation', (req: Request, res: Response) => {
  return res.json({
    items: paymentStore.reconciliationItems,
    count: paymentStore.reconciliationItems.length
  });
});

paymentRouter.post('/admin/reconciliation/run', (req: Request, res: Response) => {
  const report = paymentWorkerService.runReconciliation();
  paymentStore.logAudit({
    who: 'AdminOperator',
    what: 'MANUAL_RECONCILIATION_RUN',
    resource: 'RECONCILIATION',
    resource_id: report.timestamp,
    after: report,
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId(),
    notes: `Reconciliation executed: ${report.discrepanciesFound} discrepancies found`
  });
  return res.json(report);
});

// 6.6 Audit Logs
paymentRouter.get('/admin/audit-logs', (req: Request, res: Response) => {
  const { limit = 100 } = req.query;
  return res.json(paymentStore.auditLogs.slice(0, Number(limit)));
});

// 6.7 System Config Toggle (Safety Switch - Section 97)
paymentRouter.post('/admin/system-config', (req: Request, res: Response) => {
  const { payment_live_mode, maintenance_mode } = req.body;
  if (typeof payment_live_mode === 'boolean') {
    paymentStore.systemConfig.payment_live_mode = payment_live_mode;
  }
  if (typeof maintenance_mode === 'boolean') {
    paymentStore.systemConfig.maintenance_mode = maintenance_mode;
  }

  paymentStore.logAudit({
    who: 'SuperAdmin',
    what: 'UPDATE_SYSTEM_CONFIG',
    resource: 'SYSTEM_CONFIG',
    resource_id: 'GLOBAL_CONFIG',
    after: paymentStore.systemConfig,
    ip: req.ip || '127.0.0.1',
    trace_id: generateTraceId(),
    notes: `Toggled Live Mode to ${paymentStore.systemConfig.payment_live_mode}`
  });

  return res.json(paymentStore.systemConfig);
});

// 6.8 Dead Letter Queue (DLQ)
paymentRouter.get('/admin/dlq', (req: Request, res: Response) => {
  return res.json(Array.from(paymentStore.dlq.values()));
});
