# Guide: Switch to Oxygenstore + Redirect Embabistore

Use this guide to make **oxygenstore** your main domain and redirect **embabistore** visitors to it.

---

## Overview

| Step | What | Where |
|------|------|--------|
| 1 | Redirect embabistore → oxygenstore | Hosting (Vercel / Netlify / Cloudflare) |
| 2 | Update site URLs in environment | `.env` locally + **production env vars** |
| 3 | Configure Paymob with oxygenstore URLs | Paymob dashboard |
| 4 | Deploy and test | Browser + one test payment |

**Code changes:** Only config (`.env`). The repo has one small change: fallback URLs in code no longer point to the old domain (see bottom of this doc).

---

## Step 1: Redirect embabistore → oxygenstore

Choose where your app is hosted and do **one** of the following.

### If you use **Vercel**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → your project.
2. **Settings** → **Domains**.
3. Add **oxygenstore** (e.g. `www.oxygenstore.com` or `oxygenstore.com`) and set it as **Primary**.
4. Add **embabistore** (e.g. `www.embabistore.com`).
5. Click the **⋯** next to the embabistore domain → **Edit**.
6. Enable **Redirect to** and enter your oxygenstore URL, e.g. `https://www.oxygenstore.com`.
7. Choose **Permanent (308)** or **301**.
8. Save. Vercel will redirect all `embabistore.com` traffic to oxygenstore.

### If you use **Netlify**

1. **Domain management** → add both domains (oxygenstore as primary).
2. For embabistore: add a redirect:
   - **Redirects** → **New redirect**:
   - **From:** `https://www.embabistore.com/*` (or `https://embabistore.com/*` if you use apex).
   - **To:** `https://www.oxygenstore.com/:splat` (or your real oxygenstore URL).
   - **Status:** 301.
3. Repeat for `embabistore.com` → `oxygenstore.com` if you use both www and non-www.

### If you use **Cloudflare** (DNS or proxy)

1. **Rules** → **Redirect Rules** → **Create rule**.
2. **When:** Hostname equals `embabistore.com` (add another rule for `www.embabistore.com` if needed).
3. **Then:** Dynamic redirect:
   - **Type:** Permanent (301).
   - **Expression:** e.g. `concat("https://www.oxygenstore.com", http.request.uri.path)` (adjust to your real oxygenstore host).
4. Save and deploy.

### If you use another host

- Use your provider’s “Redirect” or “Domain forwarding” to send `embabistore.com` → `https://www.oxygenstore.com` with **301**.

---

## Step 2: Update environment variables

Your app uses two URL variables. Set both to your **oxygenstore** URL (with `https://` and the same host you use in the browser, e.g. `www.oxygenstore.com`).

### Local `.env`

Edit `embabi-store-next/.env` and set:

```env
NEXT_PUBLIC_APP_URL=https://www.oxygenstore.com
NEXT_PUBLIC_SITE_URL=https://www.oxygenstore.com
```

Replace `https://www.oxygenstore.com` with your real oxygenstore URL (e.g. `https://oxygenstore.com` if you don’t use www).

### Production (Vercel / Netlify / etc.)

1. Open your project in Vercel (or your host) → **Settings** → **Environment Variables**.
2. Set (or add):
   - `NEXT_PUBLIC_APP_URL` = `https://www.oxygenstore.com`
   - `NEXT_PUBLIC_SITE_URL` = `https://www.oxygenstore.com`
3. Apply to **Production** (and Preview if you want).
4. **Redeploy** the project so the new values are used (Paymob callbacks and redirects depend on these).

Do **not** commit real `.env` to git; only production env vars in the host dashboard.

---

## Step 3: Paymob (payment) configuration

Your app builds Paymob callback URLs from `NEXT_PUBLIC_APP_URL`:

- **Redirect (user after payment):** `https://<NEXT_PUBLIC_APP_URL>/api/paymob/webhooks/redirect`
- **Webhook (server):** `https://<NEXT_PUBLIC_APP_URL>/api/paymob/webhooks/processed`

So once you set `NEXT_PUBLIC_APP_URL` to oxygenstore and redeploy, the app will send oxygenstore URLs to Paymob. You only need to align the **dashboard**:

1. Log in to [Paymob](https://accept.paymob.com) (or your Paymob dashboard).
2. Find where **callback URL**, **return URL**, or **webhook URL** is configured for your integration/intention.
3. If any URL is set to `https://www.embabistore.com/...`, change it to the same path on oxygenstore, e.g.:
   - `https://www.oxygenstore.com/api/paymob/webhooks/redirect`
   - `https://www.oxygenstore.com/api/paymob/webhooks/processed`
4. Save. You do **not** need to change API keys, integration ID, or HMAC secret; only the domain in those URLs.

---

## Step 4: Deploy and test

1. **Redeploy** after updating production env vars (and after any code change).
2. **Redirect:** Open `https://www.embabistore.com` (and `https://embabistore.com`) and confirm you are sent to oxygenstore (URL bar shows oxygenstore).
3. **Site:** Browse oxygenstore; check homepage, product page, cart, checkout (without paying).
4. **Payment:** Place one test order with **Online Payment** and complete (or fail) the Paymob flow; confirm you land back on an oxygenstore order page (e.g. `/orders/xxx`).

---

## Summary checklist

- [ ] Redirect configured (embabistore → oxygenstore) at host/DNS.
- [ ] `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` set to oxygenstore in **production** env and redeployed.
- [ ] Local `.env` updated to oxygenstore (optional, for local testing with correct URLs).
- [ ] Paymob dashboard URLs updated to oxygenstore (if they were set to embabistore).
- [ ] Tested: redirect, site on oxygenstore, one test payment and return URL.

---

## Code change in this repo

**What changed:** Hardcoded fallback URLs in the code (used when env vars are missing) were updated from `https://embabi-store.com` to a generic placeholder `https://your-site.com` so the old domain is not used by default.  
**You must:** Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` in production (and in `.env` for local) to your real oxygenstore URL. No other code change is required for the domain switch.

Files touched: `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `components/seo/meta-tags.tsx`, `components/seo/structured-data.tsx`, `components/ui/breadcrumbs.tsx`.
