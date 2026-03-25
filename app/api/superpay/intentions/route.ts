import { NextRequest, NextResponse } from "next/server";
import { generateSuperPaySignature, buildSuperPayHeaders, SUPERPAY_BASE } from "@/lib/superpay";
import { requireCsrfOrReject } from "@/lib/csrf";
import { readJsonWithLimit } from "@/lib/body-limit";

type CreateIntentionBody = {
  orderId: string;
  amount: number;
  currency: string;
  billingData?: { name: string; email: string; phone: string };
};

const IFRAME_URL_PATH = "/api/1/sts/iframe/url";

export async function POST(req: NextRequest) {
  console.log("🚀 SuperPay intentions route called");
  try {
    const csrfReject = requireCsrfOrReject(req);
    if (csrfReject) return csrfReject;

    const body = await readJsonWithLimit<CreateIntentionBody>(req, 64 * 1024);
    const { orderId, amount, currency } = body;

    if (!orderId || amount == null || !currency) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount, currency" },
        { status: 400 }
      );
    }

    const merchantCode = process.env.SUPERPAY_MERCHANT_CODE;
    const apiKey = process.env.SUPERPAY_API_KEY;
    const secureHashKey = process.env.SUPERPAY_SECURE_HASH_KEY;

    if (!merchantCode || !apiKey || !secureHashKey) {
      console.error("SuperPay credentials missing:", {
        merchantCode: !!merchantCode,
        apiKey: !!apiKey,
        secureHashKey: !!secureHashKey,
      });
      return NextResponse.json(
        { error: "Payment service configuration error." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const amountNum = typeof amount === "number" ? amount : parseFloat(String(amount));
    const amountFormatted = amountNum.toFixed(2);

    const signature = generateSuperPaySignature(orderId, amountNum, currency, secureHashKey);

    const payload: Record<string, unknown> = {
      merchant: { code: merchantCode, apiKey },
      order: {
        merchantOrderId: orderId,
        amount: parseFloat(amountFormatted),
        currency,
      },
      signature,
      redirectionURL: `${baseUrl}/api/superpay/webhooks/redirect`,
      callbackConfig: {
        successCallbackUrls: [`${baseUrl}/api/superpay/webhooks/success`],
        failureCallbackUrls: [`${baseUrl}/api/superpay/webhooks/failure`],
      },
      embed: { enabled: true },
    };

    const url = `${SUPERPAY_BASE}${IFRAME_URL_PATH}`;
    console.log("🔍 SuperPay request details:", {
      url,
      merchant: {
        code: merchantCode,
        apiKeyPreview: apiKey ? `${apiKey.slice(0, 3)}***${apiKey.slice(-2)}` : null,
      },
      order: {
        merchantOrderId: orderId,
        amount: parseFloat(amountFormatted),
        currency,
      },
      signaturePreview: `${signature.slice(0, 6)}***${signature.slice(-6)}`,
    });
    console.log(
      "📤 SuperPay payload (signature redacted):",
      JSON.stringify({ ...payload, signature: "[REDACTED]" }, null, 2)
    );

    const res = await fetch(url, {
      method: "POST",
      headers: buildSuperPayHeaders(),
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { status?: string; url?: string };

    if (!res.ok) {
      console.error("SuperPay intention error", { status: res.status, data });
      return NextResponse.json(
        { error: "Payment service unavailable, try again later." },
        { status: 500 }
      );
    }

    if (data.status !== "SUCCESS" || !data.url) {
      console.error("SuperPay did not return success URL", data);
      return NextResponse.json(
        { error: "Payment initiation did not return a payment URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      payment_url: data.url,
      url: data.url,
      order_id: orderId,
      status: "pending",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("too large")) {
      return NextResponse.json({ error: msg }, { status: 413 });
    }
    console.error("❌ /api/superpay/intentions error:", error);
    return NextResponse.json(
      { error: "Payment service unavailable, try again later." },
      { status: 500 }
    );
  }
}
