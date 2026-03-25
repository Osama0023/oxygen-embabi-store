import crypto from "crypto";

export const SUPERPAY_BASE = process.env.SUPERPAY_BASE_URL || "https://merchant.super-pay.com/ordertransaction";

/**
 * Generate SuperPay signature for iframe/order requests.
 * Format: merchantOrderId + amount + currency (no separators)
 * HMAC-SHA256 with Secure Hash Key, output hex.
 */
export function generateSuperPaySignature(
  merchantOrderId: string,
  amount: number,
  currency: string,
  secureHashKey: string
): string {
  const amountStr = typeof amount === "number" ? amount.toFixed(2) : String(amount);
  const concatenated = `${merchantOrderId}${amountStr}${currency}`;
  return crypto.createHmac("sha256", secureHashKey).update(concatenated).digest("hex");
}

export function buildSuperPayHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}
