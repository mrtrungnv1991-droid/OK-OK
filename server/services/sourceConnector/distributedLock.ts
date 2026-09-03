// ==============================================================================
// CYBERPOOL: DISTRIBUTED LOCK FOR SOURCE ACCOUNT SCANNING
// ==============================================================================

interface LockEntry {
  key: string;
  workerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class DistributedLockManager {
  private locks: Map<string, LockEntry> = new Map();

  /**
   * Attempt to acquire a distributed lock for an account scan
   * @param accountId Target source account ID
   * @param workerId ID of the worker/process requesting lock
   * @param ttlMs Time-to-live in milliseconds (default 5 minutes)
   */
  public acquireLock(accountId: string, workerId: string, ttlMs: number = 300000): boolean {
    const key = `lock:source_scan:${accountId}`;
    const now = Date.now();

    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > now) {
      // Lock is still actively held
      return false;
    }

    // Acquire lock
    this.locks.set(key, {
      key,
      workerId,
      acquiredAt: now,
      expiresAt: now + ttlMs
    });

    return true;
  }

  /**
   * Release an acquired lock
   */
  public releaseLock(accountId: string, workerId?: string): boolean {
    const key = `lock:source_scan:${accountId}`;
    const existing = this.locks.get(key);
    if (!existing) return true;

    if (workerId && existing.workerId !== workerId) {
      // Cannot release lock held by another worker unless forced
      return false;
    }

    this.locks.delete(key);
    return true;
  }

  /**
   * Check if an account is currently locked
   */
  public isLocked(accountId: string): boolean {
    const key = `lock:source_scan:${accountId}`;
    const existing = this.locks.get(key);
    if (!existing) return false;
    if (existing.expiresAt <= Date.now()) {
      this.locks.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get active lock detail
   */
  public getLockInfo(accountId: string): LockEntry | null {
    const key = `lock:source_scan:${accountId}`;
    const existing = this.locks.get(key);
    if (!existing) return null;
    if (existing.expiresAt <= Date.now()) {
      this.locks.delete(key);
      return null;
    }
    return existing;
  }
}

export const distributedLock = new DistributedLockManager();
