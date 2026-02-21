import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n";

// Local cache simulation: add X-Local-Cache-Sim (HIT|MISS) for testing.
// Enable with ENABLE_CACHE_SIMULATION=1 (works with next dev or next start)
const CACHE_SIM_TTL_MS = 60_000;

function addCacheSimHeader(response: NextResponse, pathname: string): NextResponse {
  if (process.env.ENABLE_CACHE_SIMULATION !== "1") return response;
  const cache = (globalThis as { __cacheSim?: Map<string, number> }).__cacheSim ?? new Map<string, number>();
  (globalThis as { __cacheSim?: Map<string, number> }).__cacheSim = cache;
  const now = Date.now();
  const lastSeen = cache.get(pathname);
  const hit = lastSeen != null && now - lastSeen < CACHE_SIM_TTL_MS;
  cache.set(pathname, now);
  for (const [k, v] of cache.entries()) {
    if (now - v > CACHE_SIM_TTL_MS) cache.delete(k);
  }
  response.headers.set("X-Local-Cache-Sim", hit ? "HIT" : "MISS");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0) Locale-based routing: redirect / to /en, ensure locale prefix for locale routes
  const pathnameHasLocale = locales.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
  if (!pathname.startsWith("/api") && !pathname.startsWith("/admin") && !pathname.startsWith("/_next")) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }
    if (!pathnameHasLocale) {
      // Path like /products, /contact - redirect to /en/products, /en/contact
      const newPath = `/${defaultLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
      return NextResponse.redirect(new URL(newPath, request.url));
    }
    const segment = pathname.split("/")[1];
    if (!isValidLocale(segment)) {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }
  }

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
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    }

    // Full admin has access to everything under /admin
    if (token.role === "ADMIN") {
      return addCacheSimHeader(NextResponse.next(), pathname);
    }

    // Media buyer: only allow analytics page
    if (
      token.role === "MEDIA_BUYER" &&
      (path === "/admin/analytics" || path.startsWith("/admin/analytics"))
    ) {
      return addCacheSimHeader(NextResponse.next(), pathname);
    }

    // Any other role trying to hit /admin → redirect home
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  return addCacheSimHeader(NextResponse.next(), pathname);
}

export const config = {
  // Skip API, static assets, and Next.js internals; run middleware only for pages and admin
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|app-icon|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};