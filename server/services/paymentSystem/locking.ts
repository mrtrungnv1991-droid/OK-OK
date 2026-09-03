// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - DISTRIBUTED LOCKING & CONCURRENCY
// Conforms strictly to Sections 12 & 13 of Payment Specification
// ==============================================================================

interface LockEntry {
  resource: string;
  ownerId: string;
  expiresAt: number;
}

class DistributedLockManager {
  private locks: Map<string, LockEntry> = new Map();
  private accountActiveTransactions: Map<string, Set<string>> = new Map();

  /**
   * Acquire distributed lock on transaction (TTL in seconds, default 60s)
   */
  public acquireTransactionLock(transactionId: string, workerId: string, ttlSeconds: number = 60): boolean {
    const key = `payment:${transactionId}`;
    const now = Date.now();
    const existing = this.locks.get(key);

    if (existing && existing.expiresAt > now) {
      if (existing.ownerId === workerId) {
        // Renew lock
        existing.expiresAt = now + ttlSeconds * 1000;
        return true;
      }
      return false; // Lock owned by another worker
    }

    this.locks.set(key, {
      resource: key,
      ownerId: workerId,
      expiresAt: now + ttlSeconds * 1000
    });
    return true;
  }

  /**
   * Release transaction lock
   */
  public releaseTransactionLock(transactionId: string, workerId: string): void {
    const key = `payment:${transactionId}`;
    const existing = this.locks.get(key);
    if (existing && existing.ownerId === workerId) {
      this.locks.delete(key);
    }
  }

  /**
   * Acquire account concurrency slot (Section 13)
   * Default: 1 account = 1 active transaction
   */
  public acquireAccountSlot(accountId: string, transactionId: string, maxConcurrency: number = 1): boolean {
    let active = this.accountActiveTransactions.get(accountId);
    if (!active) {
      active = new Set();
      this.accountActiveTransactions.set(accountId, active);
    }

    if (active.has(transactionId)) {
      return true; // Already assigned to this transaction
    }

    if (active.size >= maxConcurrency) {
      return false; // Concurrency limit reached
    }

    active.add(transactionId);
    return true;
  }

  /**
   * Release account concurrency slot
   */
  public releaseAccountSlot(accountId: string, transactionId: string): void {
    const active = this.accountActiveTransactions.get(accountId);
    if (active) {
      active.delete(transactionId);
    }
  }

  /**
   * Check how many active transactions are on an account
   */
  public getAccountActiveCount(accountId: string): number {
    return this.accountActiveTransactions.get(accountId)?.size || 0;
  }
}

export const lockManager = new DistributedLockManager();
