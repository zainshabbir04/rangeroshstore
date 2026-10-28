-- =============================================================================
-- RANG E ROSH — SUPABASE POSTGRESQL SCHEMA, RLS, AND STORAGE MIGRATION
-- File: supabase/migrations/001_initial_schema.sql
-- =============================================================================
-- Security Model:
-- 1. Never rely on user-editable user_metadata for admin permissions.
-- 2. Explicit `public.admin_users` table maps authorized auth.users(id) -> admin access.
-- 3. `public.is_admin()` SECURITY DEFINER function checks if auth.uid() is an active admin.
-- 4. Row Level Security (RLS) is enabled on all tables.
-- 5. Anonymous users can ONLY read active/published catalog items & public store settings.
-- 6. Only verified admins can insert, update, delete, or read unpublished/draft records.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. EXPLICIT ADMIN AUTHORIZATION TABLE & HELPER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER set_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function to check whether the current authenticated user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
      AND is_active = TRUE
  );
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can view their own admin record (or all admin records if they are an admin)
DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
CREATE POLICY "Admins can read admin_users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Prevent client-side privilege escalation: admin_users can only be modified by existing active owners
-- (First admin is bootstrapped via SQL Editor in Supabase Dashboard as documented in README.md)
DROP POLICY IF EXISTS "Owners can manage admin_users" ON public.admin_users;
CREATE POLICY "Owners can manage admin_users"
  ON public.admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = TRUE
    )
  );

-- -----------------------------------------------------------------------------
-- 3. CATEGORIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE
-- Note: category_id uses ON DELETE RESTRICT to prevent orphaned products when
-- attempting to delete a category that still has associated products.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(12, 2) NULL CHECK (sale_price IS NULL OR (sale_price >= 0 AND sale_price < price)),
  sku TEXT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
  ON public.products(sku)
  WHERE sku IS NOT NULL AND char_length(trim(sku)) > 0;

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_public_catalog
  ON public.products(is_published, is_active, is_featured, created_at DESC);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anonymous users can only view products that are BOTH published AND active (or via direct slug lookup only if published)
-- Wait: Requirement 7 states: "If a product is inactive, unpublished, or unavailable, handle the page appropriately and prevent customers from ordering it as though it were available."
-- Requirement 10 & 12 state: "Drafts and unpublished products must not be exposed through public queries." "Anonymous users may: Read active, published products".
DROP POLICY IF EXISTS "Public can read active published products" ON public.products;
CREATE POLICY "Public can read active published products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING ((is_published = TRUE AND is_active = TRUE) OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. PRODUCT VARIANTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NULL,
  color TEXT NULL,
  sku TEXT NULL,
  stock_quantity INTEGER NULL CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique
  ON public.product_variants(sku)
  WHERE sku IS NOT NULL AND char_length(trim(sku)) > 0;

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

DROP TRIGGER IF EXISTS set_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read variants of active published products" ON public.product_variants;
CREATE POLICY "Public can read variants of active published products"
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.is_published = TRUE
        AND p.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins have full access to product_variants" ON public.product_variants;
CREATE POLICY "Admins have full access to product_variants"
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. PRODUCT IMAGES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL CHECK (char_length(trim(storage_path)) > 0),
  alt_text TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_storage_path ON public.product_images(storage_path);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read images of active published products" ON public.product_images;
CREATE POLICY "Public can read images of active published products"
  ON public.product_images
  FOR SELECT
  TO anon, authenticated
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.is_published = TRUE
        AND p.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins have full access to product_images" ON public.product_images;
CREATE POLICY "Admins have full access to product_images"
  ON public.product_images
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. STORE SETTINGS TABLE (PUBLIC DISPLAY SETTINGS)
-- Single-row table (id = 1) for public storefront configuration.
-- No secrets or private credentials are ever stored in this table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'Rang e Rosh',
  tagline TEXT NOT NULL DEFAULT 'Pakistani Ladies Stitched Suits & Luxury Pret',
  contact_email TEXT NOT NULL DEFAULT 'rangerosh.official@gmail.com',
  general_contact TEXT NOT NULL DEFAULT '+923130888048',
  whatsapp_number TEXT NOT NULL DEFAULT '+923130888048',
  shipping_contact TEXT NOT NULL DEFAULT '+923200300552',
  currency_code TEXT NOT NULL DEFAULT 'PKR',
  currency_symbol TEXT NOT NULL DEFAULT 'Rs.',
  announcement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  announcement_text TEXT NOT NULL DEFAULT 'Welcome to Rang e Rosh — Orders & Delivery Charges Are Confirmed Personally via WhatsApp',
  hero_badge TEXT NOT NULL DEFAULT 'SAMPLE COLLECTION PREVIEW — EDITABLE IN ADMIN',
  hero_headline TEXT NOT NULL DEFAULT 'Timeless Craft, Tailored for the Modern Silhouette',
  hero_subtext TEXT NOT NULL DEFAULT 'Explore Rang e Rosh ladies stitched suits crafted in breathable lawns, festive organza, and heirloom-inspired embroideries.',
  hero_cta_text TEXT NOT NULL DEFAULT 'Shop Now',
  hero_cta_link TEXT NOT NULL DEFAULT '/shop',
  hero_image_url TEXT NOT NULL DEFAULT '/images/sample/hero-editorial.svg',
  editorial_title TEXT NOT NULL DEFAULT 'The House of Rang e Rosh',
  editorial_body TEXT NOT NULL DEFAULT 'Born from a reverence for classic Pakistani textile heritage and effortless tailored silhouettes, Rang e Rosh offers ladies stitched suits designed for grace, comfort, and enduring style.',
  meta_pixel_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  meta_pixel_id TEXT NOT NULL DEFAULT '',
  instagram_url TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER set_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read store_settings" ON public.store_settings;
CREATE POLICY "Public can read store_settings"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can update store_settings" ON public.store_settings;
CREATE POLICY "Admins can update store_settings"
  ON public.store_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 8. SUPABASE STORAGE BUCKET & RLS POLICIES (`product-images`)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880, -- 5 MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read access ONLY for product-images bucket
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
CREATE POLICY "Public read access for product-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Only verified admins can upload to product-images
DROP POLICY IF EXISTS "Admins can upload product-images" ON storage.objects;
CREATE POLICY "Admins can upload product-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only verified admins can update product-images
DROP POLICY IF EXISTS "Admins can update product-images" ON storage.objects;
CREATE POLICY "Admins can update product-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.is_admin()
  );

-- Only verified admins can delete product-images
DROP POLICY IF EXISTS "Admins can delete product-images" ON storage.objects;
CREATE POLICY "Admins can delete product-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.is_admin()
  );
