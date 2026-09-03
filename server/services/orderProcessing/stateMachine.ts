// ==============================================================================
// CYBERPOOL: RELIABLE ORDER STATE MACHINE & TRANSITION VALIDATOR
// ==============================================================================

import { ReliableOrderStatus, ReliableOrder, OrderEvent } from './types';

export class OrderStateMachine {
  // Valid state transitions graph
  private static readonly ALLOWED_TRANSITIONS: Record<ReliableOrderStatus, ReliableOrderStatus[]> = {
    PENDING_PAYMENT: ['PAYMENT_CONFIRMED', 'CANCELLED'],
    PAYMENT_CONFIRMED: ['SOURCE_BALANCE_CHECKING', 'REFUNDED', 'CANCELLED'],
    SOURCE_BALANCE_CHECKING: ['PURCHASE_PENDING', 'WAITING_SOURCE_BALANCE', 'REFUNDED'],
    WAITING_SOURCE_BALANCE: ['PURCHASE_PENDING', 'CANCELLED', 'REFUNDED', 'MANUAL_REVIEW'],
    PURCHASE_PENDING: ['PURCHASE_CONFIRMED', 'PURCHASE_UNKNOWN', 'PURCHASE_FAILED', 'MANUAL_REVIEW'],
    PURCHASE_UNKNOWN: ['PURCHASE_RECONCILING', 'MANUAL_REVIEW'],
    PURCHASE_RECONCILING: ['PURCHASE_CONFIRMED', 'PURCHASE_UNKNOWN', 'PURCHASE_PENDING', 'MANUAL_REVIEW'],
    PURCHASE_FAILED: ['PURCHASE_PENDING', 'MANUAL_REVIEW', 'REFUNDED', 'CANCELLED'],
    PURCHASE_CONFIRMED: ['KEY_SECURED', 'MANUAL_REVIEW'],
    KEY_SECURED: ['DELIVERY_PENDING', 'DELIVERED', 'COMPLETED', 'MANUAL_REVIEW'],
    DELIVERY_PENDING: ['DELIVERED', 'COMPLETED', 'MANUAL_REVIEW'],
    DELIVERED: ['COMPLETED', 'MANUAL_REVIEW'],
    MANUAL_REVIEW: [
      'PURCHASE_PENDING',
      'PURCHASE_CONFIRMED',
      'KEY_SECURED',
      'DELIVERY_PENDING',
      'COMPLETED',
      'REFUNDED',
      'CANCELLED'
    ],
    COMPLETED: [], // Terminal
    CANCELLED: [], // Terminal
    REFUNDED: [] // Terminal
  };

  /**
   * Validate if a transition from currentState to targetState is mathematically and procedurally allowed
   */
  public static canTransition(from: ReliableOrderStatus, to: ReliableOrderStatus): boolean {
    if (from === to) return true;
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Performs transition validation with business rule enforcement
   */
  public static validateTransition(
    order: ReliableOrder,
    targetState: ReliableOrderStatus,
    context?: { hasSecuredKey?: boolean; hasReconciled?: boolean }
  ): { valid: boolean; error?: string } {
    // Check state graph
    if (!this.canTransition(order.status, targetState)) {
      return {
        valid: false,
        error: `Không thể chuyển trạng thái từ ${order.status} sang ${targetState} (Vi phạm State Machine)`
      };
    }

    // Rule 1: CANNOT set COMPLETED if key is not secured
    if (targetState === 'COMPLETED' && !context?.hasSecuredKey && order.status !== 'KEY_SECURED' && order.status !== 'DELIVERED') {
      return {
        valid: false,
        error: `Quy tắc 1: Không được đánh dấu COMPLETED khi chưa xác nhận KEY_SECURED trong Key Vault.`
      };
    }

    // Rule 2: CANNOT retry BUY directly from PURCHASE_UNKNOWN without reconciliation
    if (order.status === 'PURCHASE_UNKNOWN' && targetState === 'PURCHASE_PENDING') {
      if (!context?.hasReconciled) {
        return {
          valid: false,
          error: `Quy tắc 2: Không được thử mua lại (PURCHASE_PENDING) khi đang ở trạng thái PURCHASE_UNKNOWN mà chưa chạy đối soát lịch sử source.`
        };
      }
    }

    return { valid: true };
  }
}
