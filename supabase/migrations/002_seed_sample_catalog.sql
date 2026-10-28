-- =============================================================================
-- RANG E ROSH — INITIAL CATALOG SEED FROM @Final Designs (6 OFFICIAL + 2 SAMPLE)
-- File: supabase/migrations/002_seed_sample_catalog.sql
-- =============================================================================

-- 1. Seed Store Settings
INSERT INTO public.store_settings (
  id,
  store_name,
  tagline,
  contact_email,
  general_contact,
  whatsapp_number,
  shipping_contact,
  currency_code,
  currency_symbol,
  announcement_enabled,
  announcement_text,
  hero_badge,
  hero_headline,
  hero_subtext,
  hero_cta_text,
  hero_cta_link,
  hero_image_url,
  meta_pixel_enabled,
  meta_pixel_id
) VALUES (
  1,
  'Rang e Rosh',
  'Colours That Reflect Your Elegance — Ladies Stitched Suits',
  'rangerosh.official@gmail.com',
  '+923130888048',
  '+923130888048',
  '+923200300552',
  'PKR',
  'Rs.',
  TRUE,
  'Welcome to Rang e Rosh — Colours That Reflect Your Elegance | Orders Confirmed Personally via WhatsApp',
  'RANG E ROSH — STITCHED PRET COLLECTION',
  'Colours That Reflect Your Elegance',
  'Explore Rang e Rosh ladies stitched suits crafted with intricate embroidery, fine stitching, and luxurious seasonal & festive fabrics.',
  'Explore Stitched Collection',
  '/shop',
  '/images/catalog/hazel/hazel-1.jpg',
  FALSE,
  ''
)
ON CONFLICT (id) DO UPDATE SET
  tagline = EXCLUDED.tagline,
  announcement_text = EXCLUDED.announcement_text,
  hero_badge = EXCLUDED.hero_badge,
  hero_headline = EXCLUDED.hero_headline,
  hero_subtext = EXCLUDED.hero_subtext,
  hero_cta_text = EXCLUDED.hero_cta_text,
  hero_image_url = EXCLUDED.hero_image_url;

-- 2. Seed Categories
INSERT INTO public.categories (id, name, slug, description, image_url, is_active)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Signature Pret',
    'signature-pret',
    'Intricately embroidered 2-piece stitched ensembles crafted in textured karandi and seasonal fabrics.',
    '/images/catalog/hazel/hazel-1.jpg',
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Luxury Embroidered',
    'luxury-embroidered',
    'Statement embroidered long silhouettes and culotte ensembles crafted in crease-free and formal fabrics.',
    '/images/catalog/orchid-purple/orchid-1.webp',
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Pret Essentials',
    'pret-essentials',
    'Elevated daytime and festive stitched 2-piece sets with vibrant embroidery and tailored trousers.',
    '/images/catalog/daria-green/daria-1.png',
    TRUE
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Everyday Stitched',
    'everyday-stitched',
    'Ready-to-wear embroidered 2-piece suits styled for effortless grace from day to evening.',
    '/images/catalog/rust/rust-1.webp',
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- 3. Seed 8 Initial Products (6 Official @Final Designs + 2 Sample Slots)
INSERT INTO public.products (
  id, name, slug, short_description, description, category_id,
  price, sale_price, sku, is_featured, is_active, is_published
) VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    'Hazel — Cranberry Red Embroidered 2-Piece Suit',
    'hazel-cranberry-red-embroidered-2pc',
    'Hazel from the Rang e Rosh Pret Collection is a thoughtfully crafted ensemble featuring an intricately embroidered Cranberry Red shirt paired with a plain-dyed trouser.',
    'Hazel from the Rang e Rosh Pret Collection is a thoughtfully crafted ensemble featuring an intricately embroidered shirt paired with a plain-dyed trouser. The textured fabric lends the silhouette a distinctive seasonal character, while the detailed embroidery on the neckline, sleeves, and daman adds a refined finish. Designed with an effortless balance of comfort and sophistication, Hazel transitions seamlessly from casual gatherings to semi-formal occasions. Color: Cranberry Red.',
    '11111111-1111-4111-8111-111111111101',
    7490.00,
    NULL,
    'RER-HZL-001',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'Anna — Black Karandi Embroidered 2-Piece Suit',
    'anna-black-karandi-embroidered-2pc',
    'Anna from the Rang e Rosh collection features an intricately embroidered black karandi shirt paired with a plain-dyed trouser/shalwar.',
    'Anna from the Rang e Rosh collection features an embroidered shirt paired with a plain-dyed trouser/shalwar. The intricate ivory floral embroidery adds a refined touch to the textured black karandi fabric, complemented by the understated simplicity of the shalwar for a well-balanced ensemble. Color: Black.',
    '11111111-1111-4111-8111-111111111101',
    7490.00,
    NULL,
    'RER-ANA-002',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'Rust Embroidered Stitched 2-Piece Set',
    'rust-embroidered-stitched-2pc',
    'Meet this rust 2-piece set styled with delicate embroidered detailing throughout — both pieces come fully stitched and ready to wear.',
    'Meet this rust 2-piece set styled with delicate embroidered detailing throughout. Both pieces come fully stitched and ready to wear, so the fit and drape are set from the moment they arrive. Suited to festive gatherings or elevated daytime dressing alike. Color: Rust.',
    '11111111-1111-4111-8111-111111111104',
    4700.00,
    NULL,
    'RER-RST-003',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    'Zaitoon Green — Vibrant Embroidered Shirt & Pants (2-Piece)',
    'zaitoon-green-embroidered-2pc',
    'Fashion-fit short shirt with vibrant crimson and floral embroidery paired with matching green embroidered pants.',
    'Embroidered Shirt With Pants (2-Piece Stitched Ensemble). Shirt: A fashion-fit short shirt crafted in vibrant chartreuse-olive green featuring rich multi-tonal floral and botanical embroidery across the front, neckline, and sleeves. Pants: Matching green tailored pants with coordinated embroidered border detailing.',
    '11111111-1111-4111-8111-111111111103',
    8999.00,
    NULL,
    'RER-ZTN-004',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    'Orchid — Rich Purple Embroidered Ensemble with Culottes',
    'orchid-purple-embroidered-culottes-2pc',
    'Crafted in our in-house crease-free fabric, this rich purple ensemble features beautiful embroidery, a graceful long silhouette, and matching culottes.',
    'Crafted in our in-house crease-free fabric, this rich purple ensemble features beautiful embroidery and a graceful long silhouette. The shirt features carefully placed embroidered details along the neckline, front panels, and sleeves that bring depth and character to the design. Paired with matching culottes, this look combines traditional detailing with a fresh, modern feel — ideal for dinners, festive gatherings, or formal occasions.',
    '11111111-1111-4111-8111-111111111102',
    11450.00,
    NULL,
    'RER-ORC-005',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    'Daria — Emerald Green Embroidered Pret 2-Piece (DP-40)',
    'daria-emerald-green-embroidered-2pc',
    'Pret Essentials emerald green stitched 2-piece ensemble featuring an intricately embroidered shirt paired with a dyed trouser.',
    'Daria (DP-40) from the Rang e Rosh Pret Essentials collection presents a rich emerald green stitched 2-piece suit. Includes 1 Piece Embroidered Shirt and 1 Piece Dyed Trouser, finished with delicate cream and olive threadwork on the neckline, placket, and sleeves.',
    '11111111-1111-4111-8111-111111111103',
    8450.00,
    NULL,
    'RER-DP-040',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    'Noor-e-Sahar Ivory Festive 3-Piece Suit [Sample]',
    'noor-e-sahar-ivory-festive-sample',
    '[Sample Slot #7 — Editable in Admin] Warm ivory embroidered 3-piece stitched suit.',
    'SAMPLE CATALOG SLOT #7 — Replace with official product #7 in /admin.',
    '11111111-1111-4111-8111-111111111102',
    8950.00,
    NULL,
    'RER-SMP-007',
    TRUE,
    TRUE,
    TRUE
  ),
  (
    '22222222-2222-4222-8222-222222222208',
    'Gul-e-Lala Muted Rose Raw Silk Ensemble [Sample]',
    'gul-e-lala-rose-silk-sample',
    '[Sample Slot #8 — Editable in Admin] Dusty rose raw silk stitched shirt and culottes.',
    'SAMPLE CATALOG SLOT #8 — Replace with official product #8 in /admin.',
    '11111111-1111-4111-8111-111111111102',
    12500.00,
    10900.00,
    'RER-SMP-008',
    TRUE,
    TRUE,
    TRUE
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  is_featured = EXCLUDED.is_featured;

-- 4. Seed Product Variants
DELETE FROM public.product_variants WHERE product_id IN (
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202',
  '22222222-2222-4222-8222-222222222203',
  '22222222-2222-4222-8222-222222222204',
  '22222222-2222-4222-8222-222222222205',
  '22222222-2222-4222-8222-222222222206',
  '22222222-2222-4222-8222-222222222207',
  '22222222-2222-4222-8222-222222222208'
);

INSERT INTO public.product_variants (product_id, size, color, sku, stock_quantity, is_available)
VALUES
  -- 1. Hazel Cranberry Red
  ('22222222-2222-4222-8222-222222222201', 'XS', 'Cranberry Red', 'RER-HZL-001-XS', 4, TRUE),
  ('22222222-2222-4222-8222-222222222201', 'Small', 'Cranberry Red', 'RER-HZL-001-S', 6, TRUE),
  ('22222222-2222-4222-8222-222222222201', 'Medium', 'Cranberry Red', 'RER-HZL-001-M', 8, TRUE),
  ('22222222-2222-4222-8222-222222222201', 'Large', 'Cranberry Red', 'RER-HZL-001-L', 5, TRUE),
  ('22222222-2222-4222-8222-222222222201', 'XL', 'Cranberry Red', 'RER-HZL-001-XL', 3, TRUE),
  -- 2. Anna Black Karandi
  ('22222222-2222-4222-8222-222222222202', 'XS', 'Black', 'RER-ANA-002-XS', 4, TRUE),
  ('22222222-2222-4222-8222-222222222202', 'Small', 'Black', 'RER-ANA-002-S', 6, TRUE),
  ('22222222-2222-4222-8222-222222222202', 'Medium', 'Black', 'RER-ANA-002-M', 7, TRUE),
  ('22222222-2222-4222-8222-222222222202', 'Large', 'Black', 'RER-ANA-002-L', 5, TRUE),
  ('22222222-2222-4222-8222-222222222202', 'XL', 'Black', 'RER-ANA-002-XL', 3, TRUE),
  -- 3. Rust 2-Piece
  ('22222222-2222-4222-8222-222222222203', 'Small', 'Rust', 'RER-RST-003-S', 5, TRUE),
  ('22222222-2222-4222-8222-222222222203', 'Medium', 'Rust', 'RER-RST-003-M', 6, TRUE),
  ('22222222-2222-4222-8222-222222222203', 'Large', 'Rust', 'RER-RST-003-L', 4, TRUE),
  ('22222222-2222-4222-8222-222222222203', 'XL', 'Rust', 'RER-RST-003-XL', 3, TRUE),
  -- 4. Zaitoon Green
  ('22222222-2222-4222-8222-222222222204', 'XS', 'Zaitoon Green', 'RER-ZTN-004-XS', 3, TRUE),
  ('22222222-2222-4222-8222-222222222204', 'Small', 'Zaitoon Green', 'RER-ZTN-004-S', 5, TRUE),
  ('22222222-2222-4222-8222-222222222204', 'Medium', 'Zaitoon Green', 'RER-ZTN-004-M', 6, TRUE),
  ('22222222-2222-4222-8222-222222222204', 'Large', 'Zaitoon Green', 'RER-ZTN-004-L', 5, TRUE),
  ('22222222-2222-4222-8222-222222222204', 'XL', 'Zaitoon Green', 'RER-ZTN-004-XL', 3, TRUE),
  -- 5. Orchid Purple
  ('22222222-2222-4222-8222-222222222205', 'XS', 'Orchid Purple', 'RER-ORC-005-XS', 3, TRUE),
  ('22222222-2222-4222-8222-222222222205', 'Small', 'Orchid Purple', 'RER-ORC-005-S', 5, TRUE),
  ('22222222-2222-4222-8222-222222222205', 'Medium', 'Orchid Purple', 'RER-ORC-005-M', 5, TRUE),
  ('22222222-2222-4222-8222-222222222205', 'Large', 'Orchid Purple', 'RER-ORC-005-L', 4, TRUE),
  ('22222222-2222-4222-8222-222222222205', 'XL', 'Orchid Purple', 'RER-ORC-005-XL', 2, TRUE),
  -- 6. Daria Emerald Green (XS to XXL, low stock)
  ('22222222-2222-4222-8222-222222222206', 'XS', 'Emerald Green', 'RER-DP-040-XS', 1, TRUE),
  ('22222222-2222-4222-8222-222222222206', 'Small', 'Emerald Green', 'RER-DP-040-S', 2, TRUE),
  ('22222222-2222-4222-8222-222222222206', 'Medium', 'Emerald Green', 'RER-DP-040-M', 1, TRUE),
  ('22222222-2222-4222-8222-222222222206', 'Large', 'Emerald Green', 'RER-DP-040-L', 1, TRUE),
  ('22222222-2222-4222-8222-222222222206', 'XL', 'Emerald Green', 'RER-DP-040-XL', 1, TRUE),
  ('22222222-2222-4222-8222-222222222206', 'XXL', 'Emerald Green', 'RER-DP-040-XXL', 1, TRUE),
  -- 7. Sample Slot #7
  ('22222222-2222-4222-8222-222222222207', 'Small', 'Warm Ivory', 'RER-SMP-007-S', 5, TRUE),
  ('22222222-2222-4222-8222-222222222207', 'Medium', 'Warm Ivory', 'RER-SMP-007-M', 5, TRUE),
  ('22222222-2222-4222-8222-222222222207', 'Large', 'Warm Ivory', 'RER-SMP-007-L', 3, TRUE),
  -- 8. Sample Slot #8
  ('22222222-2222-4222-8222-222222222208', 'Small', 'Muted Rose', 'RER-SMP-008-S', 3, TRUE),
  ('22222222-2222-4222-8222-222222222208', 'Medium', 'Muted Rose', 'RER-SMP-008-M', 4, TRUE),
  ('22222222-2222-4222-8222-222222222208', 'Large', 'Muted Rose', 'RER-SMP-008-L', 2, TRUE);

-- 5. Seed Product Images
DELETE FROM public.product_images WHERE product_id IN (
  '22222222-2222-4222-8222-222222222201',
  '22222222-2222-4222-8222-222222222202',
  '22222222-2222-4222-8222-222222222203',
  '22222222-2222-4222-8222-222222222204',
  '22222222-2222-4222-8222-222222222205',
  '22222222-2222-4222-8222-222222222206',
  '22222222-2222-4222-8222-222222222207',
  '22222222-2222-4222-8222-222222222208'
);

INSERT INTO public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
VALUES
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-1.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-2.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-3.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-4.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-5.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 5', 4, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-6.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 6', 5, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-7.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 7', 6, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-8.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 8', 7, FALSE),
  ('22222222-2222-4222-8222-222222222201', '/images/catalog/hazel/hazel-9.jpg', 'Rang e Rosh Hazel Cranberry Red Suit View 9', 8, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-1.jpg', 'Rang e Rosh Anna Black Karandi Suit View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-2.jpg', 'Rang e Rosh Anna Black Karandi Suit View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-3.jpg', 'Rang e Rosh Anna Black Karandi Suit View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-4.jpg', 'Rang e Rosh Anna Black Karandi Suit View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-5.jpg', 'Rang e Rosh Anna Black Karandi Suit View 5', 4, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-6.jpg', 'Rang e Rosh Anna Black Karandi Suit View 6', 5, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-7.jpg', 'Rang e Rosh Anna Black Karandi Suit View 7', 6, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-8.jpg', 'Rang e Rosh Anna Black Karandi Suit View 8', 7, FALSE),
  ('22222222-2222-4222-8222-222222222202', '/images/catalog/anna/anna-9.jpg', 'Rang e Rosh Anna Black Karandi Suit View 9', 8, FALSE),
  ('22222222-2222-4222-8222-222222222203', '/images/catalog/rust/rust-1.webp', 'Rang e Rosh Rust 2-Piece Set View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222203', '/images/catalog/rust/rust-2.webp', 'Rang e Rosh Rust 2-Piece Set View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222203', '/images/catalog/rust/rust-3.webp', 'Rang e Rosh Rust 2-Piece Set View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222203', '/images/catalog/rust/rust-4.webp', 'Rang e Rosh Rust 2-Piece Set View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-1.jpg', 'Rang e Rosh Zaitoon Green Suit View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-2.jpg', 'Rang e Rosh Zaitoon Green Suit View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-3.jpg', 'Rang e Rosh Zaitoon Green Suit View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-4.jpg', 'Rang e Rosh Zaitoon Green Suit View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-5.jpg', 'Rang e Rosh Zaitoon Green Suit View 5', 4, FALSE),
  ('22222222-2222-4222-8222-222222222204', '/images/catalog/nishat-green/nishat-6.jpg', 'Rang e Rosh Zaitoon Green Suit View 6', 5, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-1.webp', 'Rang e Rosh Orchid Purple Ensemble View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-2.webp', 'Rang e Rosh Orchid Purple Ensemble View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-3.webp', 'Rang e Rosh Orchid Purple Ensemble View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-4.webp', 'Rang e Rosh Orchid Purple Ensemble View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-5.webp', 'Rang e Rosh Orchid Purple Ensemble View 5', 4, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-6.webp', 'Rang e Rosh Orchid Purple Ensemble View 6', 5, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-7.webp', 'Rang e Rosh Orchid Purple Ensemble View 7', 6, FALSE),
  ('22222222-2222-4222-8222-222222222205', '/images/catalog/orchid-purple/orchid-8.webp', 'Rang e Rosh Orchid Purple Ensemble View 8', 7, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-1.png', 'Rang e Rosh Daria Emerald Green Suit View 1', 0, TRUE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-2.png', 'Rang e Rosh Daria Emerald Green Suit View 2', 1, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-3.png', 'Rang e Rosh Daria Emerald Green Suit View 3', 2, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-4.png', 'Rang e Rosh Daria Emerald Green Suit View 4', 3, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-5.png', 'Rang e Rosh Daria Emerald Green Suit View 5', 4, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-6.png', 'Rang e Rosh Daria Emerald Green Suit View 6', 5, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-7.png', 'Rang e Rosh Daria Emerald Green Suit View 7', 6, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-8.png', 'Rang e Rosh Daria Emerald Green Suit View 8', 7, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-9.png', 'Rang e Rosh Daria Emerald Green Suit View 9', 8, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-10.png', 'Rang e Rosh Daria Emerald Green Suit View 10', 9, FALSE),
  ('22222222-2222-4222-8222-222222222206', '/images/catalog/daria-green/daria-11.png', 'Rang e Rosh Daria Emerald Green Suit View 11', 10, FALSE),
  ('22222222-2222-4222-8222-222222222207', '/images/sample/product-1.svg', '[Sample Photo] Noor-e-Sahar Ivory Suit', 0, TRUE),
  ('22222222-2222-4222-8222-222222222208', '/images/sample/product-2.svg', '[Sample Photo] Gul-e-Lala Muted Rose Suit', 0, TRUE);
