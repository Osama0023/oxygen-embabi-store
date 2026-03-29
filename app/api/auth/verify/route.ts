import { NextResponse } from "next/server";
import { verifyCode } from "@/lib/verification";
import { validateEmail, normalizeEmail } from "@/lib/validation";
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request);
    const limit = checkRateLimit(key, "verify");
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const { email: rawEmail, code } = await request.json();
    const email = typeof rawEmail === "string" ? normalizeEmail(rawEmail) : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.errors[0] },
        { status: 400 }
      );
    }

    const result = await verifyCode(email, code);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
} 