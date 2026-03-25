import { NextRequest, NextResponse } from "next/server";

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

    const merchantOrderId =
      params.merchantOrderId || params.merchant_order_id || params.orderId || params.order_id || "";
    const status =
      (params.status || params.paymentStatus || params.payment_status || "").toLowerCase();

    const xfProto = req.headers.get("x-forwarded-proto");
    const xfHost = req.headers.get("x-forwarded-host");
    const hostHeader = req.headers.get("host");
    let origin = `${xfProto || url.protocol.replace(":", "")}://${xfHost || hostHeader || url.host}`;
    if (origin.startsWith("httphttp")) origin = origin.replace("httphttp", "http");

    const publicBase = process.env.NEXT_PUBLIC_APP_URL;
    const baseUrl = publicBase && /localhost/.test(origin) ? publicBase : origin;

    const isSuccess =
      status === "success" || status === "successful" || status === "completed" || status === "paid";

    if (merchantOrderId) {
      const orderPath = `/orders/${merchantOrderId}`;
      const query = isSuccess ? "" : "?payment=failed";
      return NextResponse.redirect(`${baseUrl}${orderPath}${query}`);
    }

    return NextResponse.redirect(`${baseUrl}/payment/result?status=${isSuccess ? "success" : "failed"}`);
  } catch (error) {
    console.error("SuperPay redirect error", error);
    const publicBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${publicBase}/payment/result?status=failed`);
  }
}
