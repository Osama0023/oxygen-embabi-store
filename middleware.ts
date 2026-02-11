import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const token = await getToken({ req: request, secret });

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const path = request.nextUrl.pathname;

    // No auth at all → block any admin access
    if (!token || !token.role) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Full admin has access to everything under /admin
    if (token.role === "ADMIN") {
      return NextResponse.next();
    }

    // Media buyer: only allow analytics page
    if (
      token.role === "MEDIA_BUYER" &&
      (path === "/admin/analytics" || path.startsWith("/admin/analytics"))
    ) {
      return NextResponse.next();
    }

    // Any other role trying to hit /admin → redirect home
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};