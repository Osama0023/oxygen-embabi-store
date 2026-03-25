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

/** Browser redirect outcome after SuperPay checkout (from `params` JSON or flat query). */
export type SuperPayRedirectOutcome = "success" | "failed" | "pending";

/**
 * Map SuperPay `orderStatus` in the redirect payload to how we should treat the return URL.
 * Unknown values default to `pending` so we do not show a false "payment failed" message.
 */
export function mapSuperPayRedirectOrderStatus(
  orderStatus: string | undefined
): SuperPayRedirectOutcome {
  const s = (orderStatus || "").trim().toUpperCase();
  if (!s) return "pending";

  if (
    s === "PAY_COMPLETED" ||
    s === "SUCCESS" ||
    s === "COMPLETED" ||
    s === "PAID" ||
    s === "CAPTURED" ||
    s === "SETTLED"
  ) {
    return "success";
  }

  if (
    s === "INIAITE_AUTHORIZE"
  ) {
    // SuperPay typo seen on failure webhooks alongside status: FAILURE
    return "failed";
  }

  if (
    s === "PAY_FAILED" ||
    s === "FAILED" ||
    s === "FAILURE" ||
    s === "CANCELLED" ||
    s === "CANCELED" ||
    s === "DECLINED" ||
    s === "REJECTED" ||
    s === "EXPIRED" ||
    s === "VOIDED" ||
    s === "PAY_CANCELLED" ||
    s === "PAYMENT_FAILED"
  ) {
    return "failed";
  }

  if (
    s === "PAY_PENDING" ||
    s === "PENDING" ||
    s === "PROCESSING" ||
    s === "AUTHORIZED" ||
    s === "AUTH" ||
    s === "IN_PROGRESS" ||
    s === "INITIATED" ||
    s === "CREATED" ||
    s === "AWAITING_PAYMENT"
  ) {
    return "pending";
  }

  return "pending";
}

/**
 * Full redirect `params` JSON (base64-decoded). SuperPay may send both `status`
 * (e.g. FAILURE) and `orderStatus` (e.g. INIAITE_AUTHORIZE typo) — the top-level
 * `status` field must win over `orderStatus`.
 */
export function mapSuperPayRedirectPayload(data: {
  status?: string;
  orderStatus?: string;
}): SuperPayRedirectOutcome {
  const top = (data.status || "").trim().toUpperCase();
  if (top === "FAILURE" || top === "FAILED" || top === "ERROR") {
    return "failed";
  }
  if (
    top === "SUCCESS" ||
    top === "OK" ||
    top === "COMPLETED" ||
    top === "SUCCEEDED"
  ) {
    return "success";
  }
  if (top === "PENDING" || top === "PROCESSING") {
    return "pending";
  }
  return mapSuperPayRedirectOrderStatus(data.orderStatus);
}

/** Flat query `status` / `paymentStatus` (non-base64 redirect). */
export function mapSuperPayFlatRedirectStatus(status: string): SuperPayRedirectOutcome {
  const s = status.trim().toLowerCase();
  if (!s) return "pending";
  if (
    ["success", "successful", "completed", "paid", "capture", "captured", "settled"].includes(s)
  ) {
    return "success";
  }
  if (
    ["failed", "failure", "cancelled", "canceled", "declined", "rejected", "error", "expired"].includes(
      s
    )
  ) {
    return "failed";
  }
  if (["pending", "processing", "authorized", "in_progress", "initiated", "awaiting"].includes(s)) {
    return "pending";
  }
  return "pending";
}
