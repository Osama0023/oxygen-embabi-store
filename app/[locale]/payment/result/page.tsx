"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

function PaymentResultContent() {
  const params = useSearchParams();
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const status = params.get("status");

  // Try to get order ID from localStorage (set during checkout)
  useEffect(() => {
    if (status === "failed") {
      const lastOrderId = localStorage.getItem("lastOrderId");
      if (lastOrderId) {
        // Redirect to order page with failed payment flag
        router.replace(`/${locale}/orders/${lastOrderId}?payment=failed`);
        return;
      }
    }
  }, [status, router, locale]);

  let title = "Payment failed, please try again";
  let emoji = "❌";
  if (status === "success") {
    title = "Payment successful";
    emoji = "✅";
  } else if (status === "pending") {
    title = "Payment pending, please confirm in your wallet/Valu app";
    emoji = "⏳";
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-sm text-center max-w-md">
        <div className="text-5xl mb-4">{emoji}</div>
        <h1 className="text-xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-gray-600">You can close this window and return to the store.</p>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse bg-white rounded-xl p-8 shadow-sm w-full max-w-md h-48" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}







