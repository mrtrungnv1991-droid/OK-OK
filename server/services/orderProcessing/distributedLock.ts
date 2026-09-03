// ==============================================================================
// CYBERPOOL: DISTRIBUTED ORDER LOCK & OPTIMISTIC CONCURRENCY
// ==============================================================================

interface LockEntry {
  lock_key: string;
  worker_id: string;
  acquired_at: number;
  expires_at: number;
  ttl_ms: number;
}

export class DistributedOrderLock {
  private static instance: DistributedOrderLock;
  private locks: Map<string, LockEntry> = new Map();

  private constructor() {
    // Periodic garbage collector for expired locks every 10 seconds
    setInterval(() => {
      this.cleanupExpiredLocks();
    }, 10000);
  }

  public static getInstance(): DistributedOrderLock {
    if (!DistributedOrderLock.instance) {
      DistributedOrderLock.instance = new DistributedOrderLock();
    }
    return DistributedOrderLock.instance;
  }

  /**
   * Tries to acquire an exclusive distributed lock for an order
   * Mimics Redis: SET order_lock:CP-88219 worker-01 NX EX 120
   */
  public acquireLock(
    orderId: string,
    workerId: string,
    ttlSeconds: number = 120
  ): { acquired: boolean; currentOwner?: string; expiresAt?: string; message: string } {
    const lockKey = `order_lock:${orderId}`;
    const now = Date.now();
    const existing = this.locks.get(lockKey);

    if (existing && existing.expires_at > now) {
      if (existing.worker_id === workerId) {
        // Re-entrant lock extension
        existing.expires_at = now + ttlSeconds * 1000;
        return {
          acquired: true,
          currentOwner: workerId,
          expiresAt: new Date(existing.expires_at).toISOString(),
          message: `Lock gia hạn thành công cho worker ${workerId}`
        };
      }

      return {
        acquired: false,
        currentOwner: existing.worker_id,
        expiresAt: new Date(existing.expires_at).toISOString(),
        message: `Order đang bị khóa bởi worker ${existing.worker_id} (hết hạn lúc ${new Date(existing.expires_at).toLocaleTimeString('vi-VN')})`
      };
    }

    // Lock is either unheld or expired
    const entry: LockEntry = {
      lock_key: lockKey,
      worker_id: workerId,
      acquired_at: now,
      expires_at: now + ttlSeconds * 1000,
      ttl_ms: ttlSeconds * 1000
    };

    this.locks.set(lockKey, entry);

    return {
      acquired: true,
      currentOwner: workerId,
      expiresAt: new Date(entry.expires_at).toISOString(),
      message: `Khóa phân tán order ${orderId} thành công cho worker ${workerId}`
    };
  }

  /**
   * Releases the exclusive lock if owned by this worker
   */
  public releaseLock(orderId: string, workerId: string): boolean {
    const lockKey = `order_lock:${orderId}`;
    const existing = this.locks.get(lockKey);

    if (!existing) return true;

    if (existing.worker_id === workerId) {
      this.locks.delete(lockKey);
      return true;
    }

    // Attempting to release a lock owned by another worker
    return false;
  }

  /**
   * Check if order is locked
   */
  public isLocked(orderId: string): { locked: boolean; owner?: string; remainingSeconds?: number } {
    const lockKey = `order_lock:${orderId}`;
    const existing = this.locks.get(lockKey);
    const now = Date.now();

    if (existing && existing.expires_at > now) {
      return {
        locked: true,
        owner: existing.worker_id,
        remainingSeconds: Math.ceil((existing.expires_at - now) / 1000)
      };
    }

    return { locked: false };
  }

  /**
   * List all active distributed locks for inspection
   */
  public getActiveLocks(): Array<{ order_id: string; worker_id: string; acquired_at: string; expires_at: string; remaining_sec: number }> {
    const now = Date.now();
    const result: Array<{ order_id: string; worker_id: string; acquired_at: string; expires_at: string; remaining_sec: number }> = [];

    this.locks.forEach((entry, key) => {
      if (entry.expires_at > now) {
        const orderId = key.replace('order_lock:', '');
        result.push({
          order_id: orderId,
          worker_id: entry.worker_id,
          acquired_at: new Date(entry.acquired_at).toISOString(),
          expires_at: new Date(entry.expires_at).toISOString(),
          remaining_sec: Math.max(0, Math.ceil((entry.expires_at - now) / 1000))
        });
      }
    });

    return result;
  }

  private cleanupExpiredLocks() {
    const now = Date.now();
    for (const [key, entry] of this.locks.entries()) {
      if (entry.expires_at <= now) {
        this.locks.delete(key);
      }
    }
  }
}

export const orderLock = DistributedOrderLock.getInstance();
