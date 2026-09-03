// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - ROUTING ENGINE & FAILOVER
// Conforms strictly to Sections 14, 15, 16 of Payment Specification
// ==============================================================================

import { SourceAccount, PaymentTransaction } from './types';
import { circuitBreaker } from './circuitBreaker';
import { lockManager } from './locking';

export interface RouteSelectionResult {
  selectedAccount?: SourceAccount;
  score: number;
  evaluatedCandidatesCount: number;
  rejectionReasons: { accountId: string; reason: string }[];
}

export class RoutingEngine {
  /**
   * Evaluate and select best Source Account for a transaction
   * Dynamic score: balance_score + health_score + reliability_score - error_penalty - cooldown_penalty - load_penalty
   */
  public selectAccount(
    transaction: PaymentTransaction,
    allAccounts: SourceAccount[],
    excludedAccountIds: Set<string> = new Set()
  ): RouteSelectionResult {
    const rejectionReasons: { accountId: string; reason: string }[] = [];
    const candidates: { account: SourceAccount; score: number }[] = [];
    const now = Date.now();

    // Check provider circuit breaker
    const cbStatus = circuitBreaker.getCircuitStatus(transaction.provider_id);
    if (!cbStatus.canExecute) {
      return {
        selectedAccount: undefined,
        score: 0,
        evaluatedCandidatesCount: allAccounts.length,
        rejectionReasons: [{
          accountId: 'PROVIDER_LEVEL',
          reason: `Provider Circuit Breaker is ${cbStatus.state}. Cooldown until: ${cbStatus.cooldownUntil || 'N/A'}`
        }]
      };
    }

    for (const account of allAccounts) {
      // 1. Skip excluded accounts (e.g. from previous failed attempts in this transaction)
      if (excludedAccountIds.has(account.id)) {
        rejectionReasons.push({ accountId: account.id, reason: 'Already attempted in this transaction sequence' });
        continue;
      }

      // 2. Provider ID match
      if (account.provider_id !== transaction.provider_id) {
        continue; // Different provider
      }

      // 3. Currency match
      if (account.currency !== transaction.currency) {
        rejectionReasons.push({ accountId: account.id, reason: `Currency mismatch: account ${account.currency} vs tx ${transaction.currency}` });
        continue;
      }

      // 4. Status ACTIVE
      if (account.status !== 'ACTIVE') {
        rejectionReasons.push({ accountId: account.id, reason: `Account status is ${account.status}` });
        continue;
      }

      // 5. Cooldown check
      if (account.cooldown_until && new Date(account.cooldown_until).getTime() > now) {
        rejectionReasons.push({ accountId: account.id, reason: `Account in cooldown until ${account.cooldown_until}` });
        continue;
      }

      // 6. Available balance check (verified - reserved)
      const available = account.balance - account.reserved_balance;
      if (available < transaction.amount) {
        rejectionReasons.push({
          accountId: account.id,
          reason: `Insufficient available balance: ${available} < ${transaction.amount}`
        });
        continue;
      }

      // 7. Transaction limit
      if (account.transaction_limit > 0 && transaction.amount > account.transaction_limit) {
        rejectionReasons.push({
          accountId: account.id,
          reason: `Amount exceeds transaction limit: ${transaction.amount} > ${account.transaction_limit}`
        });
        continue;
      }

      // 8. Daily limit
      if (account.daily_limit > 0 && (account.used_today + transaction.amount) > account.daily_limit) {
        rejectionReasons.push({
          accountId: account.id,
          reason: `Daily limit reached: used ${account.used_today} + ${transaction.amount} > ${account.daily_limit}`
        });
        continue;
      }

      // 9. Concurrency check (Section 13)
      const currentConcurrent = lockManager.getAccountActiveCount(account.id);
      if (currentConcurrent >= account.concurrency_limit) {
        rejectionReasons.push({
          accountId: account.id,
          reason: `Concurrency limit reached (${currentConcurrent}/${account.concurrency_limit})`
        });
        continue;
      }

      // 10. Calculate Dynamic Score
      // Base balance score: higher available balance gets higher preference (up to 100 pts)
      const balanceRatio = Math.min(1, available / (transaction.amount * 5));
      const balanceScore = balanceRatio * 40;

      // Reliability score based on error count
      const errorPenalty = Math.min(50, account.error_count * 15);
      const reliabilityScore = Math.max(0, 40 - errorPenalty);

      // Load penalty based on today's utilization
      const dailyUtilization = account.daily_limit > 0 ? account.used_today / account.daily_limit : 0;
      const loadPenalty = dailyUtilization * 20;

      // Recency bonus if it succeeded recently
      const recencyBonus = account.last_successful_transaction ? 10 : 0;

      const totalScore = balanceScore + reliabilityScore + recencyBonus - loadPenalty;

      candidates.push({ account, score: totalScore });
    }

    if (candidates.length === 0) {
      return {
        selectedAccount: undefined,
        score: 0,
        evaluatedCandidatesCount: allAccounts.length,
        rejectionReasons
      };
    }

    // Sort descending by totalScore
    candidates.sort((a, b) => b.score - a.score);

    return {
      selectedAccount: candidates[0].account,
      score: candidates[0].score,
      evaluatedCandidatesCount: allAccounts.length,
      rejectionReasons
    };
  }
}

export const routingEngine = new RoutingEngine();
