// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - BALANCE RESERVATION ENGINE
// Conforms strictly to Sections 6, 7, 20, 63 of Payment Specification
// ==============================================================================

import { SourceAccount } from './types';

interface ReservationRecord {
  id: string;
  accountId: string;
  transactionId: string;
  amount: number;
  reservedAt: number;
  expiresAt: number;
}

export class BalanceReservationEngine {
  private reservations: Map<string, ReservationRecord> = new Map();

  /**
   * Verify and reserve balance for a transaction.
   * Atomic operation preventing double-spending and over-spending.
   */
  public reserveBalance(
    account: SourceAccount,
    amount: number,
    transactionId: string,
    ttlSeconds: number = 300 // 5 minutes
  ): { success: boolean; availableBefore: number; availableAfter: number; reason?: string } {
    // Check available balance formula: verified_balance - reserved_balance
    const currentAvailable = account.balance - account.reserved_balance;

    if (currentAvailable < amount) {
      return {
        success: false,
        availableBefore: currentAvailable,
        availableAfter: currentAvailable,
        reason: `Insufficient available balance: ${currentAvailable} < ${amount}`
      };
    }

    // Check daily limit
    if (account.daily_limit > 0 && (account.used_today + amount) > account.daily_limit) {
      return {
        success: false,
        availableBefore: currentAvailable,
        availableAfter: currentAvailable,
        reason: `Daily limit exceeded: ${account.used_today + amount} > ${account.daily_limit}`
      };
    }

    // Apply reservation
    const now = Date.now();
    const reservationKey = `${account.id}:${transactionId}`;
    
    account.reserved_balance += amount;
    account.available_balance = account.balance - account.reserved_balance;

    this.reservations.set(reservationKey, {
      id: reservationKey,
      accountId: account.id,
      transactionId,
      amount,
      reservedAt: now,
      expiresAt: now + ttlSeconds * 1000
    });

    return {
      success: true,
      availableBefore: currentAvailable,
      availableAfter: account.available_balance
    };
  }

  /**
   * Settle reserved amount upon external SUCCESS:
   * Deducts from verified balance, releases reserved balance, updates daily used.
   */
  public settleReservation(account: SourceAccount, transactionId: string): void {
    const reservationKey = `${account.id}:${transactionId}`;
    const record = this.reservations.get(reservationKey);

    if (record) {
      const amount = record.amount;
      account.balance -= amount;
      account.reserved_balance = Math.max(0, account.reserved_balance - amount);
      account.available_balance = account.balance - account.reserved_balance;
      account.used_today += amount;
      account.last_successful_transaction = new Date().toISOString();
      this.reservations.delete(reservationKey);
    }
  }

  /**
   * Release reserved amount upon FAILED / CANCELLED:
   * Restores available balance without deducting verified balance.
   */
  public releaseReservation(account: SourceAccount, transactionId: string): void {
    const reservationKey = `${account.id}:${transactionId}`;
    const record = this.reservations.get(reservationKey);

    if (record) {
      const amount = record.amount;
      account.reserved_balance = Math.max(0, account.reserved_balance - amount);
      account.available_balance = account.balance - account.reserved_balance;
      this.reservations.delete(reservationKey);
    }
  }

  /**
   * Periodic garbage collection: Clean up stale reservations (e.g. from crashed workers)
   */
  public cleanExpiredReservations(accounts: Map<string, SourceAccount>): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.reservations.entries()) {
      if (record.expiresAt < now) {
        const account = accounts.get(record.accountId);
        if (account) {
          account.reserved_balance = Math.max(0, account.reserved_balance - record.amount);
          account.available_balance = account.balance - account.reserved_balance;
        }
        this.reservations.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
}

export const balanceReservationEngine = new BalanceReservationEngine();
