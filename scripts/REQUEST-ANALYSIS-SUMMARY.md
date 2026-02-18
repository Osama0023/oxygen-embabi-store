# Request usage analysis (Feb 2026)

## What you provided

- **Top Pages CSV** (Feb 11 9pm – Feb 18 9:59pm): page views by path (Visitors, Total).
- **Vercel log export** (1 hour): function invocations with `requestPath`, `function`, etc.

## Where the 750k requests go (from 1h log sample)

| Route/Function              | Count (1h) | Notes |
|-----------------------------|------------|--------|
| `/api/auth/[...nextauth]`   | 20         | Session checks – many components use `useSession()`, each can trigger a request. |
| `/categories/[slug].rsc`    | 20         | RSC payloads for category pages (client nav). |
| `/products/[slug].rsc`      | 15         | RSC payloads for product pages. |
| `/api/wishlist`             | 13         | Fetched on navbar, product cards, wishlist page – multiple times per visit. |
| `/api/cart`                 | 7          | Fetched in layout/cart components. |
| `/api/analytics/track`      | 7          | One per page view (from PageViewTracker). |
| `/categories/[slug]` (HTML) | 6         | Full page loads. |

**Top Pages (7 days)**  
- "/" → 3040 visitors, 6201 total  
- "/products" → 927 visitors, 2096 total  
- "/products/honor-win-rt" → 822 visitors, 1079 total  
- Plus many product/category pages.

So in 1 hour we already see **~100+ function invocations** from a small slice of traffic. Scaled to 8 days with 3.5k visitors and lots of navigation, **session + wishlist + cart + RSC + analytics** explain the high request count.

## Root causes

1. **Session** – NextAuth `useSession()` refetches often (default refetch on window focus). Many components (navbar, user button, profile, cart, wishlist, etc.) call `useSession()`, so one user can trigger many `/api/auth/session` calls.
2. **Wishlist/Cart** – Fetched from several places (layout, product cards, cart page). No shared cache/deduplication, so multiple mounts = multiple API calls.
3. **Analytics** – Every route change sends a POST to `/api/analytics/track`. No rate limit, so bots or heavy navigation increase count.
4. **RSC/Pages** – Each client navigation requests the corresponding `.rsc` or page. With `vercelCache: MISS` in the sample, cache may be cold or not applied to all routes.

## Fixes applied (codebase)

1. **Image API cache** – Restored 5‑minute cache on `/api/images/products`, `/api/images/categories`, `/api/images/carousel` (were no-cache for testing).
2. **Session refetch** – `SessionProvider` uses `refetchInterval={24 * 60 * 60}` (once per day) to cut `/api/auth/session` calls.
3. **Analytics rate limit** – `/api/analytics/track` is rate-limited (30/min per IP) to cap spam and bot traffic.
4. **Cart & wishlist GET** – `Cache-Control: private, max-age=30` so the browser can reuse the response for 30s (fewer duplicate GETs).

## How to get “by route” in the future (free plan)

- Export logs when you need a breakdown (e.g. 1h as you did).
- Run: `node scripts/count-log-routes.js [path/to/export.json]` (default: `scripts/oxygen-embabi-store-log-export-2026-02-18T18-53-57.json`).
- That prints request counts by `function` for the exported period.

## Optional next steps (if you need to reduce further)

- **Cart/Wishlist** – We added 30s browser cache. For more savings, use a single provider that fetches once and shares data (or SWR/React Query with `staleTime`) so navbar + product cards + pages don’t each call the API.
- **RSC/ISR** – Pages already use `revalidate`. You can increase revalidate on rarely-changing pages (e.g. categories to 15–20 min) to reduce server work.
- **Block bots** – Add middleware to return 403 or 429 for requests with empty or known-bot User-Agent to cut crawler traffic (optional).
