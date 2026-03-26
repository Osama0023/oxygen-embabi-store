/**
 * SuperPay VAT on online card payments: 2% of the order base + 2 EGP fixed.
 * Base = subtotal + shipping − coupon discount (checkout `totalWithDiscount`).
 */
export function computeSuperPayVatEgp(baseEgp: number): number {
  return Math.round(baseEgp * 0.02) + 2;
}
