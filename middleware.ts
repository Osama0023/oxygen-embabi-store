import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) Lightweight bot filter for public traffic
  // Run only for GETs on non-auth, non-webhook routes
  if (
    request.method === "GET" &&
    !pathname.startsWith("/api/paymob/webhooks") &&
    !pathname.startsWith("/api/auth")
  ) {
    const ua = request.headers.get("user-agent") || "";
    const uaLower = ua.toLowerCase();

    const allowedBots = [
      "googlebot",
      "bingbot",
      "duckduckbot",
      "slurp",
      "facebookexternalhit",
      "facebookcatalog",
      "whatsapp",
      "twitterbot",
      "linkedinbot",
    ];

    const knownBad = [
      "python-requests",
      "curl/",
      "wget/",
      "scrapy",
      "aiohttp",
      "httpclient",
      "libwww-perl",
      "go-http-client",
      "okhttp",
      "axios",
      "postmanruntime",
      "insomnia",
    ];

    const isAllowedBot = allowedBots.some((b) => uaLower.includes(b));
    const isBadClient = knownBad.some((b) => uaLower.includes(b));

    if (!ua || (isBadClient && !isAllowedBot)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // 2) Existing admin auth protection
  if (pathname.startsWith("/admin")) {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    const token = await getToken({ req: request, secret });
    const path = pathname;

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
  // Skip API, static assets, and Next.js internals; run middleware only for pages and admin
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|app-icon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};