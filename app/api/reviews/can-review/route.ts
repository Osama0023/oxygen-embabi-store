import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reviews/can-review?productId=xxx
 * Returns { canReview: boolean } - true if user is logged in and has a DELIVERED order containing this product
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ canReview: false });
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.user.id,
          status: "DELIVERED",
        },
      },
    });

    return NextResponse.json({ canReview: !!hasPurchased });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json({ canReview: false });
  }
}
