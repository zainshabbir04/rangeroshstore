# Rang e Rosh — Supabase Setup, RLS Security, Hosting & Client Handover Guide

---

## Part 1: Supabase Project & Database Migration Setup

1. Go to [https://supabase.com](https://supabase.com) and create a new **Free Tier** project (e.g. `rang-e-rosh-prod`).
2. Once the database finishes provisioning, open **SQL Editor** in the Supabase left sidebar.
3. Open [supabase/migrations/001_initial_schema.sql](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/supabase/migrations/001_initial_schema.sql), copy its entire contents, paste into the SQL Editor, and click **Run**.
   - This creates:
     - `public.admin_users` + `public.is_admin()` security definer function
     - `public.categories`
     - `public.products` (with `ON DELETE RESTRICT` on `category_id` to prevent orphaned products)
     - `public.product_variants`
     - `public.product_images`
     - `public.store_settings`
     - `storage.buckets` (`product-images`, public read, 5 MB limit, allowed MIME types: JPEG, PNG, WebP, AVIF, SVG)
     - Strict Row Level Security (RLS) policies on all tables and `storage.objects`.
4. (Optional) To preload the 8 sample suits into Supabase, open [supabase/migrations/002_seed_sample_catalog.sql](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/supabase/migrations/002_seed_sample_catalog.sql), paste into the SQL Editor, and click **Run**.

---

## Part 2: Safe Initial-Admin Bootstrap Process

We **never** allow public admin registration and **never** rely on user-editable `user_metadata` for admin permissions. Instead, admin access requires both a valid Supabase Auth session **and** an active row in `public.admin_users`.

### Step-by-Step First Admin Creation:
1. In your Supabase Dashboard, go to **Authentication → Providers → Email** and disable **"Allow new users to sign up"** if you want to block public signups at the Auth level as well.
2. Go to **Authentication → Users** and click **Add user → Create new user**.
3. Enter:
   - **Email:** `rangerosh.official@gmail.com`
   - **Password:** Choose a strong, unique password
   - **Auto Confirm User:** Checked (`true`)
4. Copy the generated **User UID** (e.g. `a1b2c3d4-...`).
5. Open **SQL Editor** and run the following query to authorize the owner account:
   ```sql
   INSERT INTO public.admin_users (user_id, email, role, is_active)
   VALUES (
     'PASTE-YOUR-AUTH-USER-UUID-HERE',
     'rangerosh.official@gmail.com',
     'owner',
     TRUE
   );
   ```
6. You can now sign in at `/admin/login` using `rangerosh.official@gmail.com` and your password.

---

## Part 3: Verifying RLS & Storage Security

Before launching publicly, you can verify that unauthorized writes are blocked using the Supabase SQL Editor role impersonation or browser console:

```sql
-- Simulate an anonymous visitor attempting to insert or modify a product:
SET LOCAL ROLE anon;

-- 1. Reading active published products succeeds:
SELECT id, name, price FROM public.products;

-- 2. Attempting to update a product price as anon FAILS (0 rows affected / permission denied):
UPDATE public.products SET price = 1 WHERE slug = 'noor-e-sahar-embroidered-3pc-sample';

-- 3. Attempting to read unpublished drafts as anon returns 0 rows:
SELECT id, name FROM public.products WHERE is_published = FALSE;
```

---

## Part 4: Budget Analysis (< PKR 10,000 Target) & Static Hosting Comparison

### Initial Build Cost Breakdown:
- **Application Source Code, Design System, Storefront & Admin Studio:** PKR 0 recurring software license cost (Open-source React + Vite + Tailwind + TypeScript).
- **Database, Auth & Image Storage (Supabase Free Plan):** **PKR 0 / month**
  - *Current Free Plan Limits to Note:*
    - 500 MB PostgreSQL database space (sufficient for tens of thousands of product records)
    - 1 GB Supabase Storage (with client-side WebP compression at ~100–200 KB per image, holds ~5,000+ product photos)
    - 5 GB cached + 5 GB uncached Storage egress per month
    - **Important Limitation:** Free-tier Supabase projects pause after 7 days of inactivity. Regular customer visits or admin logins keep it active, or a lightweight scheduled ping / upgrading to Supabase Pro ($25/mo) in the future prevents pausing.
- **WhatsApp Order Channel:** **PKR 0 / month** (Uses standard `https://wa.me/` deep links; no paid WhatsApp Business API required).

### Static Frontend Hosting Comparison (Free Tier Options):

| Provider | Free Bandwidth / Month | Commercial Use on Free Tier | Custom Domain + SSL | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Cloudflare Pages** | **Unlimited** static bandwidth | Allowed | Free SSL included | **Recommended #1** for e-commerce ads traffic |
| **Netlify (Starter)** | 100 GB / month | Allowed | Free SSL included | Strong #2 option |
| **Vercel (Hobby)** | 100 GB / month | *Non-commercial personal use only per Vercel ToS* | Free SSL included | Requires Pro ($20/mo) for commercial stores |

### Deployment Steps (Cloudflare Pages or Netlify):
1. Push this repository to a private GitHub repository.
2. In **Cloudflare Pages** (or **Netlify**), click **Create a project → Connect to Git**.
3. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `20` or `22`
4. Add your public environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `VITE_WHATSAPP_NUMBER`, etc.).
5. For SPA routing (`React Router`), create or verify `_redirects` / SPA fallback so all routes (`/shop`, `/product/*`, `/admin/*`) resolve to `/index.html`.

---

## Part 5: Meta Pixel Testing & Privacy Guide

1. Obtain your numeric Pixel ID from **Meta Events Manager**.
2. Either set `VITE_META_PIXEL_ID` in `.env.local` OR log into `/admin/settings`, enter your **Meta Pixel ID**, check **Enable Live Meta Pixel Tracking**, and click **Save Settings**.
3. Open **Meta Events Manager → Test Events** and enter your website URL.
4. Browse the storefront and verify:
   - `PageView` fires once per route navigation.
   - `ViewContent` fires when opening a product page (`/product/:slug`) with `content_ids`, `value` in `PKR`, and `currency: "PKR"`.
   - `AddToCart` fires when adding a selected size/color suit to the shopping bag.
   - `InitiateCheckout` and custom event `WhatsAppOrderClick` fire when clicking **Place Order on WhatsApp**.
   - **Verify:** No `Purchase` event is fired, and no customer name, phone number, or address is transmitted in any event payload.
5. **Privacy & Consent Confirmation:** Before running live Meta ads, confirm whether your target regions require an explicit cookie banner (for Pakistan domestic traffic, standard disclosure in `/privacy-policy` is included).

---

## Part 6: Replacing Sample Catalog with Official Client Products (Handover Checklist)

All 8 initial products and 4 categories are clearly marked with `[Sample]` so no unverified prices or product claims are presented as final.

### Before Public Launch, the Owner Should:
1. Log into `/admin/login`.
2. Open **Categories (`/admin/categories`)**:
   - Edit the 4 sample categories (or create new ones), remove `[Sample Category]` from their descriptions, and upload official category cover photographs.
3. Open **Products (`/admin/products`)**:
   - Either edit each of the 8 sample products to replace `[Sample]` titles, descriptions, PKR prices, sizes/colors, and upload real Rang e Rosh product photography — or delete the sample products and click **Add Product (`/admin/products/new`)** to create the real catalog.
4. Open **Store Settings (`/admin/settings`)**:
   - Update the Homepage Announcement bar with confirmed delivery/promotional copy.
   - Upload the official campaign Hero photograph and update the Hero headline/badge.
   - Verify the WhatsApp order number (`+923130888048`), general contact (`+923130888048`), shipping contact (`+923200300552`), and official social media links.
