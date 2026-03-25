import { NextRequest, NextResponse } from "next/server";
import {
  mapSuperPayFlatRedirectStatus,
  mapSuperPayRedirectOrderStatus,
  type SuperPayRedirectOutcome,
} from "@/lib/superpay";

/**
 * SuperPay often returns a single `params` query arg: base64-encoded JSON with
 * merchantOrderId, orderStatus (e.g. PAY_COMPLETED), signature, etc.
 */
function parseSuperPayRedirect(searchParams: URLSearchParams): {
  merchantOrderId: string;
  outcome: SuperPayRedirectOutcome;
} {
  const flat = Object.fromEntries(searchParams.entries());

  const encoded = flat.params;
  if (encoded && typeof encoded === "string") {
    try {
      const json = Buffer.from(encoded, "base64").toString("utf8");
      const data = JSON.parse(json) as {
        merchantOrderId?: string;
        orderStatus?: string;
      };
      const merchantOrderId = data.merchantOrderId || "";
      if (merchantOrderId) {
        return {
          merchantOrderId,
          outcome: mapSuperPayRedirectOrderStatus(data.orderStatus),
        };
      }
    } catch (e) {
      console.error("SuperPay redirect: failed to decode params blob", e);
    }
  }

  const merchantOrderId =
    flat.merchantOrderId ||
    flat.merchant_order_id ||
    flat.orderId ||
    flat.order_id ||
    "";
  const rawStatus =
    flat.status || flat.paymentStatus || flat.payment_status || "";
  const outcome = mapSuperPayFlatRedirectStatus(rawStatus);

  return { merchantOrderId, outcome };
}

function orderPathQuery(outcome: SuperPayRedirectOutcome): string {
  if (outcome === "success") return "";
  if (outcome === "failed") return "?payment=failed";
  return "?payment=pending";
}

/**
 * SuperPay user redirect handler (redirectionURL).
 * SuperPay redirects the user's browser here after payment.
 * We redirect to the order page with payment status.
 */
export async function GET(req: NextRequest) {
  console.log("🔄 SuperPay REDIRECT webhook called");
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    console.log("📦 Redirect params:", JSON.stringify(params));

    const { merchantOrderId, outcome } = parseSuperPayRedirect(url.searchParams);

    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const hostHeader = req.headers.get("host");
    let origin = `${xfProto || url.protocol.replace(":", "")}://${xfHost || hostHeader || url.host}`;
    if (origin.startsWith("httphttp")) origin = origin.replace("httphttp", "http");

    const publicBase = process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl = publicBase && /localhost/.test(origin) ? publicBase : origin;

    if (merchantOrderId) {
      const orderPath = `/orders/${merchantOrderId}`;
      const query = orderPathQuery(outcome);
      return NextResponse.redirect(`${baseUrl}${orderPath}${query}`);
    }

    return NextResponse.redirect(
      `${baseUrl}/payment/result?status=${outcome}`
    );
  } catch (error) {
    console.error("SuperPay redirect error", error);
    const publicBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${publicBase}/payment/result?status=failed`);
  }
}
