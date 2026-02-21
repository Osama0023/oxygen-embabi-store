# Next.js Project Deep Analysis Report
**embabi-store-next** — Technical audit based on actual codebase inspection  
*Generated: Feb 21, 2026*

---

## PART 1 — Project Structure

### 1) Router: App Router only
| Check | Result |
|-------|--------|
| Contains `/app` directory | ✅ Yes |
| Contains `/pages` directory | ❌ No |
| Both used | ❌ No — **App Router only** |

### 2) Next.js Version
**15.5.7** (from `package.json`: `"next": "^15.5.7"`)

### 3) Deployment Output Mode & Config
**File:** `next.config.ts` (primary) — `next.config.js` also exists with images config

| Config | Present | Notes |
|--------|---------|-------|
| `output: 'standalone'` | ❌ No | Not set |
| Experimental flags | ❌ No | None |
| Images config | ⚠️ In `next.config.js` | `remotePatterns` for https hosts (google, drive, mega) |
| Edge-related config | ❌ No | None |

**Other:** CSP headers, cache headers for static assets (app-icon, favicon, logo), security headers (X-Frame-Options, HSTS in prod).

---

## PART 2 — Rendering Strategy

### 4) Product details page (`/products/[slug]`)

**File:** `app/products/[slug]/page.tsx`

| Export | Value |
|--------|-------|
| `export const revalidate` | `21600` (6 hours) |
| `export const dynamic` | Not exported |
| `export const runtime` | Not exported |

**Fetch usage:** None. Uses **Prisma** directly (no `fetch` with `cache`, `revalidate`, or `force-dynamic`).

**SSR:** Yes. The page is a server component that:
- Calls `getServerSession(authOptions)` 
- Fetches product data via Prisma
- Renders on the server per request

**Note:** Root layout uses `await cookies()` for language, which opts the app into dynamic rendering. Product page has `revalidate = 21600` for ISR, but layout-level dynamic behavior may reduce caching effectiveness.

### 5) Homepage rendering
**Strategy: ISR (Incremental Static Regeneration)**

- `export const revalidate = 21600` (6 hours)
- Data fetched via Prisma (carousel, coupons, products, categories)
- Root layout uses `cookies()` → layout is dynamic; page segment can still benefit from revalidation

### 6) Edge Runtime
**No files use `export const runtime = 'edge'`.**

---

## PART 3 — Data Fetching & Database

### 7) Database Access
**Prisma** — `@prisma/client` with PostgreSQL

### 8) Global Singleton
**Yes.** `lib/prisma.ts`:

```ts
const prismaClient = globalThis.prisma || new PrismaClient(...);
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prismaClient;
}
```

Prevents new client per request in development.

### 9) Connection Pooling
**Configured at schema level:**

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

- `directUrl` supports Prisma Migrate with pooled connections
- Actual pooling depends on `DATABASE_URL` (e.g. pgBouncer, Supabase pooler)

### 10) Database Query Count

**Homepage** (`app/page.tsx`):
| Query | Count |
|-------|-------|
| carouselImage.findMany | 1 |
| heroThumbnail.findMany | 1 |
| coupon.findMany | 1 |
| product.findMany (featured) | 1 |
| product.findMany (new arrival) | 1 |
| category.findMany (parents with products) | 1 |
| product.findMany (per parent category section) | **N** (parent categories with 4+ products) |
| category.findMany (main) | 1 |
| category.findMany (all for brand grouping) | 1 |
| category.findMany (subcategories) | 1 |

**Total: ~9 + N** (typically **14–18** when N ≈ 5–9)

**Product page** (`app/products/[slug]/page.tsx`):
| Query | In | Count |
|-------|----|-------|
| product.findUnique | generateMetadata | 1 |
| review.aggregate | generateMetadata | 1 |
| product.findUnique | Page | 1 |
| orderItem.findFirst | Page (if logged in) | 0–1 |
| category.findUnique | Page | 1 |
| product.findMany (you may also like) | Page | 1 |

**Total: 5–6 Prisma queries** (+ `getServerSession` which may hit DB)

---

## PART 4 — Static Generation

### 11) `generateStaticParams()` for product pages
**Not implemented.** No matches in codebase.

### 12) Build-time static generation
**No.** Product pages are not pre-generated at build.

### 13) With 35 products
- **No** pre-generation
- Pages are generated **on demand** at first request
- `revalidate = 21600` → cached for 6 hours after first view

---

## PART 5 — API Routes

### 14) All API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | NextAuth |
| `/api/auth/mobile-login` | Mobile auth |
| `/api/auth/verify` | Email verification |
| `/api/auth/signup` | Registration |
| `/api/auth/reset-password` | Password reset |
| `/api/auth/resend-code` | Resend verification |
| `/api/auth/check-role` | Role check |
| `/api/cart` | Cart GET/POST |
| `/api/cart/add` | Add to cart |
| `/api/cart/update` | Update cart |
| `/api/cart/remove` | Remove from cart |
| `/api/wishlist` | Wishlist |
| `/api/wishlist/add` | Add to wishlist |
| `/api/wishlist/remove` | Remove from wishlist |
| `/api/products` | Products list |
| `/api/products/[productId]` | Single product |
| `/api/categories` | Categories |
| `/api/categories/[categoryId]` | Single category |
| `/api/categories/seed` | Seed categories |
| `/api/coupons/active` | Active coupons |
| `/api/coupons/current` | Current cart coupon |
| `/api/coupons/verify` | Verify coupon |
| `/api/coupons/remove` | Remove coupon |
| `/api/orders/create` | Create order |
| `/api/orders/[id]/status` | Order status |
| `/api/orders/analytics` | Order analytics |
| `/api/orders/bulk-update` | Bulk update |
| `/api/orders/[id]/cancel-items` | Cancel items |
| `/api/orders/export` | Export orders |
| `/api/search` | Search |
| `/api/analytics/track` | Analytics tracking |
| `/api/analytics/track` | Rate-limited (30/min per IP) |
| `/api/reviews` | Reviews |
| `/api/contact` | Contact form |
| `/api/contact/test` | Contact test |
| `/api/upload` | Upload |
| `/api/upload/cloudinary` | Cloudinary upload |
| `/api/images/carousel` | Carousel images |
| `/api/images/categories` | Category images |
| `/api/images/products` | Product images |
| `/api/carousel` | Carousel data |
| `/api/hero-thumbnails` | Hero thumbnails |
| `/api/settings/maintenance` | Maintenance mode |
| `/api/csrf` | CSRF |
| `/api/paymob/intentions` | Paymob |
| `/api/paymob/webhooks/*` | Paymob webhooks |
| `/api/user/profile` | User profile |
| `/api/user/orders` | User orders |
| `/api/profile` | Profile |
| `/api/admin/*` | Admin CRUD (settings, stats, users, products, orders, coupons, carousel, etc.) |

### 15) Frequently used routes (from REQUEST-ANALYSIS-SUMMARY.md)
| Route | Usage |
|-------|-------|
| `/api/auth/[...nextauth]` | Session checks (many `useSession()` calls) |
| `/api/cart` | Navbar, cart page, StoreInitializer |
| `/api/wishlist` | Navbar, product cards, wishlist page |
| `/api/analytics/track` | Every page view (PageViewTracker) |
| `/api/coupons/current` | Checkout, StoreInitializer |

### 16) Cart storage
| Storage | Used |
|---------|------|
| Database | ✅ Yes — `Cart` (logged-in), `AnonymousCart` (guest) |
| Cookies | ✅ Yes — `cart_session_id` for anonymous cart |
| localStorage | ❌ No |
| Server session | ❌ No — uses DB + cookie-based session ID |

---

## PART 6 — Images & Optimization

### 17) Next.js `<Image />`
**Yes.** Via `StoreImage` (`components/ui/store-image.tsx`):

```tsx
import Image, { ImageProps } from 'next/image';
export function StoreImage({ src, ...props }: ImageProps) {
  return <Image src={src} unoptimized={shouldSkipOptimization(src)} {...props} />;
}
```

### 18) Image optimization
**Bypassed for external/same-origin:**

- `unoptimized={true}` for:
  - `http://`, `https://`, `//`
  - Paths starting with `/`
- Intended to avoid Vercel Image Optimization and reduce Edge requests

### 19) Image hosting
**Cloudinary (external CDN)** — `res.cloudinary.com` in CSP and Cloudinary SDK in use.

---

## PART 7 — Performance Risk Assessment

### 20) Product pages SSR?
**Yes.** Server components + Prisma, rendered per request.

### 21) Forcing dynamic rendering?
**Effectively yes.** Root layout uses `await cookies()` for `lang`, which opts the layout (and subtree) into dynamic rendering.

### 22) Patterns that increase serverless executions
1. **Root layout `cookies()`** — every page hit is dynamic
2. **Per-page cart/wishlist sync** — StoreInitializer calls `/api/cart`, `/api/wishlist`, `/api/coupons/current` on load
3. **Session checks** — `useSession()` used in navbar, profile, cart, wishlist (SessionProvider now has `refetchInterval={24*60*60}`, `refetchOnWindowFocus={false}`)
4. **Analytics** — PageViewTracker POST on every route change (rate-limited 30/min)
5. **No `generateStaticParams`** — all product pages on-demand

### 23) Suited for 30–40 products?
**Partly.** ISR and revalidation are set, but:
- Layout `cookies()` limits full static benefits
- No static pre-generation for product pages
- Heavy per-request DB load (14–18 queries on homepage)

---

## Summary

### A) Current rendering strategy
- **App Router** with server components
- **Dynamic layout** due to `cookies()` for `lang`
- **ISR with `revalidate = 21600`** on homepage, products, categories
- **No static pre-generation** for product pages
- **No Edge runtime** anywhere

### B) Risk level
**Medium–High**

- Dynamic layout limits caching
- Many per-visit API calls (cart, wishlist, analytics, session)
- No static product pre-generation for small catalog

### C) Immediate optimization recommendations
1. **Reduce layout dynamism** — move `lang` from layout `cookies()` to client-only (e.g. client component + `localStorage`), or use a separate layout for static routes.
2. **Add `generateStaticParams`** for product pages to pre-generate 30–40 products at build.
3. **Consolidate cart/wishlist** — single fetch, shared state, or SWR/React Query with `staleTime` to cut repeated `/api/cart` and `/api/wishlist`.
4. **Revisit analytics** — batch or debounce PageViewTracker, or send events less frequently.

### D) Likely cause of ~1M requests in 7 days
From `REQUEST-ANALYSIS-SUMMARY.md` and code:

1. **Session** — many `useSession()` consumers; each window focus or tab switch can refetch (mitigated by `refetchOnWindowFocus={false}`).
2. **Cart/Wishlist** — navbar, product cards, cart page, wishlist page, checkout; StoreInitializer fetches on every full load.
3. **Analytics** — POST on every route change; rate-limited but still frequent.
4. **RSC payloads** — each client navigation fetches `.rsc` for products/categories.
5. **Dynamic rendering** — layout `cookies()` prevents static caching, so more server executions.
6. **Traffic scale** — ~3k homepage visitors and ~1k product page views per day imply many navigations and API calls per user.

**Order-of-magnitude:**  
~3k visitors × ~5–10 requests per visit (session, cart, wishlist, analytics, RSC) × 7 days ≈ 100k–200k+ from user actions alone. Bots, crawlers, and repeated navigation can push this toward 1M.
