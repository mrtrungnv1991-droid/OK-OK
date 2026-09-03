// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - STATE MACHINE & RETRY POLICY
// Conforms strictly to Sections 9, 10, 16, 17, 18, 50 of Payment Specification
// ==============================================================================

import { PaymentStatus } from './types';

// Legal transition graph
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ['VALIDATING', 'CANCELLED'],
  VALIDATING: ['QUEUED', 'WAITING_FOR_BALANCE', 'FAILED', 'CANCELLED'],
  QUEUED: ['RESERVED', 'WAITING_FOR_BALANCE', 'CANCELLED', 'FAILED'],
  WAITING_FOR_BALANCE: ['QUEUED', 'FAILED', 'MANUAL_REVIEW', 'CANCELLED'],
  RESERVED: ['PROCESSING', 'FAILED', 'CANCELLED'],
  PROCESSING: ['SUCCESS', 'RETRY_WAIT', 'PENDING_EXTERNAL', 'UNKNOWN', 'FAILED'],
  PENDING_EXTERNAL: ['SUCCESS', 'FAILED', 'UNKNOWN', 'MANUAL_REVIEW'],
  UNKNOWN: ['SUCCESS', 'FAILED', 'MANUAL_REVIEW'],
  RETRY_WAIT: ['PROCESSING', 'MANUAL_REVIEW', 'FAILED', 'CANCELLED'],
  MANUAL_REVIEW: ['SUCCESS', 'FAILED', 'RETRY_WAIT'],
  SUCCESS: [], // Terminal
  FAILED: ['RETRY_WAIT', 'MANUAL_REVIEW'], // Can only be re-tried via controlled admin action
  CANCELLED: [] // Terminal
};

export class PaymentStateMachine {
  /**
   * Check if transition from currentStatus to nextStatus is valid.
   */
  public canTransition(currentStatus: PaymentStatus, nextStatus: PaymentStatus): boolean {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(nextStatus);
  }

  /**
   * Determine if an error is retryable (Section 16).
   */
  public isRetryableError(errorCode?: string): boolean {
    if (!errorCode) return false;

    const retryableCodes = [
      'PROVIDER_TIMEOUT',
      'NETWORK_ERROR',
      'TEMPORARY_UNAVAILABLE',
      'PROVIDER_RATE_LIMIT',
      'PROVIDER_5XX',
      'CONNECTION_RESET',
      'HTTP_502',
      'HTTP_503',
      'HTTP_504',
      'RATE_LIMIT'
    ];

    return retryableCodes.some(c => errorCode.toUpperCase().includes(c));
  }

  /**
   * Calculate exponential backoff delay with random jitter (Section 17).
   * attempt 1: ~5s
   * attempt 2: ~15s
   * attempt 3: ~30s
   * attempt 4: ~60s
   * attempt 5: ~120s
   */
  public calculateRetryDelay(attemptNumber: number): number {
    const baseDelays = [5, 15, 30, 60, 120];
    const index = Math.min(attemptNumber - 1, baseDelays.length - 1);
    const baseDelaySec = baseDelays[Math.max(0, index)];
    
    // Add 10-30% random jitter to avoid thundering herd
    const jitter = Math.random() * (baseDelaySec * 0.25);
    return Math.round((baseDelaySec + jitter) * 1000); // in ms
  }
}

export const paymentStateMachine = new PaymentStateMachine();
