import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * SuperPay success callback (server-to-server).
 * SuperPay POSTs here when payment succeeds.
 */
export async function POST(req: NextRequest) {
  console.log("🔔 SuperPay SUCCESS webhook called");
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    console.log("📦 Success webhook payload:", JSON.stringify(payload));

    const merchantOrderId =
      (payload.merchantOrderId as string) ||
      (payload.merchant_order_id as string) ||
      (payload.orderId as string) ||
      "";

    if (!merchantOrderId) {
      console.warn("SuperPay success webhook: no merchantOrderId");
      return NextResponse.json({ ok: true });
    }

    await prisma.order.update({
      where: { id: String(merchantOrderId) },
      data: {
        paymentStatus: "SUCCESS",
        status: "PROCESSING",
        trnxId: (payload.transactionId as string) || (payload.paymentgwOrderId as string) || null,
        statusHistory: {
          create: {
            status: "PROCESSING",
            comment: "Payment successful - Updated by SuperPay webhook",
          },
        },
      },
    }).catch((e) => {
      console.error("Failed to update order from SuperPay success webhook", e);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("SuperPay success webhook error", error);
    return NextResponse.json({ ok: true }); // Return 200 to avoid retries
  }
}
