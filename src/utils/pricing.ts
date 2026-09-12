import { CartItem } from '../types';
import { AppliedCouponInfo } from '../contexts/CartContext';

// ==============================================================================
// CYBERPOOL FIX (#8 frontend audit): công thức giá phải GIỐNG HỆT server
// (server/services/orderService.ts:createInstantPurchase):
//   1. base = retailPrice * quantity (theo TỪNG item)
//   2. bulk discount theo quantity của TỪNG item: >=5 → ×0.93, >=2 → ×0.97
//   3. voucher áp sau bulk, trên giá của TỪNG item:
//      - percent: clamp 0-100, cap maxDiscount, chỉ áp nếu afterBulk >= minOrderValue
//      - fixed: trừ thẳng (floor 0), chỉ áp nếu afterBulk >= minOrderValue
// Client cũ tính bulk trên TỔNG số món và voucher trên TỔNG tiền → hiển thị
// một giá, server thu giá khác (khách mua 3 món A + 2 món B: client -7%,
// server chỉ -3% từng dòng).
// ==============================================================================

export interface ItemPriceBreakdown {
  base: number;
  afterBulk: number;
  voucherDiscount: number;
  final: number;
}

export function priceSingleItem(
  retailPrice: number,
  quantity: number,
  voucher: AppliedCouponInfo | null
): ItemPriceBreakdown {
  const base = Math.round(retailPrice * quantity);

  // Bulk theo quantity của chính item đó (khớp server validQuantity)
  let afterBulk = base;
  if (quantity >= 5) {
    afterBulk = Math.max(0, Math.round(base * 0.93));
  } else if (quantity >= 2) {
    afterBulk = Math.max(0, Math.round(base * 0.97));
  }

  // Voucher (khớp server: chỉ áp khi afterBulk >= minOrderValue)
  let voucherDiscount = 0;
  if (voucher) {
    const minOrder = Number(voucher.minOrderValue || 0);
    if (afterBulk >= minOrder) {
      if (voucher.discountType === 'percent') {
        const clamped = Math.min(100, Math.max(0, Number(voucher.discountValue || 0)));
        let d = Math.round((afterBulk * clamped) / 100);
        const cap = Number(voucher.maxDiscount || 0);
        if (cap > 0) d = Math.min(d, cap);
        voucherDiscount = Math.min(d, afterBulk);
      } else if (voucher.discountType === 'fixed') {
        voucherDiscount = Math.min(Number(voucher.discountValue || 0), afterBulk);
      }
    }
  }

  return { base, afterBulk, voucherDiscount, final: Math.max(0, afterBulk - voucherDiscount) };
}

export interface CartTotals {
  subtotal: number;          // tổng base
  bulkDiscountAmount: number;
  voucherDiscountAmount: number;
  finalTotal: number;        // số server sẽ thu (tổng các dòng final)
}

export function computeCartTotals(
  items: CartItem[],
  voucher: AppliedCouponInfo | null
): CartTotals {
  let subtotal = 0;
  let bulkDiscountAmount = 0;
  let voucherDiscountAmount = 0;
  let finalTotal = 0;

  for (const item of items) {
    const b = priceSingleItem(item.product.retailPrice, item.quantity, voucher);
    subtotal += b.base;
    bulkDiscountAmount += b.base - b.afterBulk;
    voucherDiscountAmount += b.voucherDiscount;
    finalTotal += b.final;
  }

  return { subtotal, bulkDiscountAmount, voucherDiscountAmount, finalTotal };
}
