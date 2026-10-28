# Rang e Rosh — Complete E-Commerce Website & Admin Studio

**Brand:** Rang e Rosh (`Pakistani Ladies Stitched Suits & Luxury Pret`)  
**Official Business Email:** [rangerosh.official@gmail.com](mailto:rangerosh.official@gmail.com)  
**General & WhatsApp Order Contact:** `+923130888048`  
**Shipping & Dispatch Contact:** `+923200300552`  
**Country & Currency:** Pakistan — `PKR` (`Rs.`)

---

## 1. Architecture & Technology Stack

- **Frontend:** React 19, Vite 6, TypeScript 5.7, Tailwind CSS 4, React Router 7
- **Backend & Database:** Supabase PostgreSQL, Supabase Auth, Supabase Storage, Supabase Row Level Security (RLS)
- **Order Channel:** WhatsApp (`+923130888048`) with manual owner confirmation workflow
- **Marketing & Attribution:** Optional Meta Pixel (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, custom `WhatsAppOrderClick` — zero PII and zero false `Purchase` events) + session `UTM` campaign capture
- **Testing:** Vitest + React Testing Library (`npm run test`), TypeScript (`tsc -b`), ESLint (`npm run lint`)

---

## 2. Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   Copy [.env.example](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/.env.example) to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Note: If you run the app before filling in your live Supabase credentials, the application automatically runs in **Local Sandbox Mode** seeded with the 8 clearly marked `[Sample]` suits persisted in `localStorage` so you can test the entire storefront and `/admin` CRUD dashboard immediately.)*
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Run tests, linter, and production build:**
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

---

## 3. Environment Variables Reference (`.env.example`)

| Variable | Description | Where to Obtain |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public `anon` client key (safe for frontend with RLS enabled) | Supabase Dashboard → Project Settings → API → Project API Keys (`anon` `public`) |
| `VITE_META_PIXEL_ID` | Optional numeric Meta Pixel ID (10–20 digits) | Meta Events Manager → Data Sources → Dataset ID |
| `VITE_SITE_URL` | Canonical public URL of the website (e.g., `https://rangerosh.pk`) | Your custom domain or static hosting URL |
| `VITE_WHATSAPP_NUMBER` | Default WhatsApp order recipient (`+923130888048`) | Centralized business configuration |
| `VITE_GENERAL_CONTACT` | General customer care contact (`+923130888048`) | Centralized business configuration |
| `VITE_SHIPPING_CONTACT` | Shipping & dispatch contact (`+923200300552`) | Centralized business configuration |
| `VITE_BUSINESS_EMAIL` | Official business email (`rangerosh.official@gmail.com`) | Centralized business configuration |

> **SECURITY RULE:** Never place your Supabase `service_role` secret key, database password, or private API tokens in `.env.local` or any `VITE_*` variable.

---

## 4. Detailed Setup & Handover Documentation

All operational, security, deployment, and handover guides are located in the `docs/` and `supabase/` directories:

1. **SQL Migrations:**
   - [001_initial_schema.sql](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/supabase/migrations/001_initial_schema.sql) — Relational tables, indexes, triggers, `admin_users` security definer function, RLS policies, and `product-images` Storage bucket policies.
   - [002_seed_sample_catalog.sql](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/supabase/migrations/002_seed_sample_catalog.sql) — Initial store settings, 4 categories, and 8 clearly marked `[Sample]` Pakistani ladies stitched suits.
2. **Comprehensive Setup, Security, Hosting & Handover Guide:**
   - [SUPABASE_AND_DEPLOYMENT_GUIDE.md](file:///c:/Users/lenovo/OneDrive/Desktop/rangerosh/docs/SUPABASE_AND_DEPLOYMENT_GUIDE.md) — Covers Supabase setup, RLS & Storage verification, First-Admin bootstrap, Budget & Static Hosting comparison (< PKR 10,000 target), Meta Pixel testing, and Client Handover instructions.
