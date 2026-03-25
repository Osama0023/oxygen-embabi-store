import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * SuperPay failure callback (server-to-server).
 * SuperPay POSTs here when payment fails.
 */
export async function POST(req: NextRequest) {
  console.log("🔔 SuperPay FAILURE webhook called");
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    console.log("📦 Failure webhook payload:", JSON.stringify(payload));

    const merchantOrderId =
      (payload.merchantOrderId as string) ||
      (payload.merchant_order_id as string) ||
      (payload.orderId as string) ||
      "";

    if (!merchantOrderId) {
      console.warn("SuperPay failure webhook: no merchantOrderId");
      return NextResponse.json({ ok: true });
    }

    await prisma.order.update({
      where: { id: String(merchantOrderId) },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
        statusHistory: {
          create: {
            status: "CANCELLED",
            comment: "Payment failed - Updated by SuperPay webhook",
          },
        },
      },
    }).catch((e) => {
      console.error("Failed to update order from SuperPay failure webhook", e);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SuperPay failure webhook error", error);
    return NextResponse.json({ ok: true }); // Return 200 to avoid retries
  }
}
