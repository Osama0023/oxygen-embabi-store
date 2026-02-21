# Route-Based Localization Refactor Summary

## Completed

### 1. Route Structure
- **Locales:** `/en/...` and `/ar/...`
- **Root redirect:** `/` → `/en`
- **Middleware:** Validates locale prefix, redirects paths without locale to `/{defaultLocale}{path}`

### 2. Layout Architecture
- **app/[locale]/layout.tsx** – Locale root layout with `html lang`, `dir`, fonts from `params.locale` (fully static)
- **app/admin/layout.tsx** – Admin root layout (separate root, no locale)
- **No app/layout.tsx** – Next.js uses [locale] and admin as separate roots

### 3. No cookies() in Layout
- `lang` and `dir` come from `params.locale`
- Zero RTL flash (correct on first paint)

### 4. Locale Infrastructure
- `lib/i18n.ts` – `locales`, `defaultLocale`, `isValidLocale`, `getDir`
- `components/locale-provider.tsx` – `LocaleProvider`, `useLocale`
- `components/locale-link.tsx` – `LocaleLink` for in-app navigation
- `useTranslation()` – Uses `useLocale()` instead of cookies

### 5. Language Switcher
- Switches via URL navigation (`/ar/...`, `/en/...`)
- No cookies or `window.location.reload`

### 6. Updated Components (LocaleLink)
- Navbar, Footer, MainCategoriesCarousel, CategoriesCarousel, ProductCard

### 7. Sitemap
- Updated for `/en` and `/ar` URLs
- DB errors are caught so static pages are still emitted

---

## Remaining Work

### 1. generateStaticParams (Products & Categories)
Add to:
- `app/[locale]/products/[slug]/page.tsx`
- `app/[locale]/categories/[slug]/page.tsx`

Example:
```ts
export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } });
  return locales.flatMap((locale) =>
    products.map((p) => ({ locale, slug: p.slug }))
  );
}
export const revalidate = 86400; // categories
export const revalidate = 21600; // products (or 86400)
```

### 2. Product Page – hasPurchased (Option C)
- Remove `getServerSession` and `hasPurchased` from the product page
- Add `/api/reviews/can-review` (or similar) for purchase eligibility
- Add client component `WriteReviewButton` that:
  - Fetches eligibility
  - Shows “Write review” only when eligible

### 3. More LocaleLink Usage
Replace `Link` with `LocaleLink` where links are in-app:

- `components/products/product-details.tsx`
- `components/cart/cart-items.tsx`
- `components/checkout/checkout-page.tsx`
- `components/wishlist/wishlist-items.tsx` (fix `/product/` → `/products/`)
- `components/ui/search-bar.tsx`
- `components/categories/category-card.tsx`
- `components/categories/subcategories-carousel.tsx`
- `components/home/coupon-banner.tsx`
- `components/home/brands-carousel.tsx`
- `components/home/carousel.tsx` (handle relative `linkUrl`)
- Auth forms (`login-form.tsx`, `signup-form.tsx`, `reset-password-form.tsx`)

### 4. Auth Pages – Locale-Aware Redirects
- Ensure `redirect` calls use `/${locale}/login` etc.
- Update NextAuth `pages.signIn` if needed (middleware redirects `/login` → `/en/login` by default)

### 5. Pages That Read cookies() for lang
Remove `cookies()` and use `params.locale` where still present:

- `app/[locale]/categories/[slug]/page.tsx`
- `app/[locale]/deals/page.tsx`
- `app/[locale]/contact/page.tsx`
- `app/[locale]/most-selling/page.tsx`
- `app/[locale]/policies/page.tsx`
- `app/[locale]/reviews/page.tsx`
- `app/[locale]/branches/page.tsx`
- `app/[locale]/orders/[id]/page.tsx`
- `app/[locale]/(auth)/*` (login, signup, verify, reset-password)

### 6. NextAuth Callback URLs
- Ensure post-login redirect preserves locale (e.g. `/ar/checkout` after login)
- May need custom `callbackUrl` handling in auth flow

---

## Testing Checklist

- [ ] Visit `/` → redirects to `/en`
- [ ] Visit `/products` → redirects to `/en/products`
- [ ] `/en/products` and `/ar/products` render correctly
- [ ] Language switcher changes URL (e.g. `/en/products` → `/ar/products`)
- [ ] No RTL flash when opening `/ar/...`
- [ ] Admin at `/admin` works (separate root layout)
- [ ] Cart, wishlist, checkout work with locale prefix
- [ ] Login/signup redirect preserves locale

---

## Migration for Existing URLs

Old URLs like `/products/foo` will redirect to `/en/products/foo` via middleware. Consider:

1. **Redirects in next.config.ts** for SEO (e.g. `/products/:slug` → `/en/products/:slug` with 308)
2. **hreflang** in metadata for `/en` and `/ar` variants
