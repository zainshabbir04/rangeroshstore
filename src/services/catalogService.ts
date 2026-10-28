// =============================================================================
// RANG E ROSH — CATALOG, CATEGORIES, SETTINGS & STORAGE SERVICE
// =============================================================================
// Connects to Supabase PostgreSQL & Storage when VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY are configured.
// When running locally before a live Supabase project is linked, falls back to
// a persistent browser database (`localStorage`) seeded with the 8 clearly
// marked [Sample] products so every storefront and admin CRUD workflow can be
// tested end-to-end and survives page refreshes.
// =============================================================================

import type {
  Category,
  CategoryInput,
  DashboardStatistics,
  Product,
  ProductImage,
  ProductInput,
  ProductVariant,
  StoreSettings,
} from '@/types';
import { BRAND_CONFIG } from '@/lib/config';
import { getSupabaseClient } from '@/lib/supabase';
import {
  INITIAL_SAMPLE_CATEGORIES,
  INITIAL_SAMPLE_PRODUCTS,
  INITIAL_STORE_SETTINGS,
} from './sampleCatalog';
import { isValidSlug } from '@/utils/format';
import {
  buildSafeStorageObjectPath,
  optimizeImageForUpload,
  validateImageFile,
} from '@/utils/imageOptimizer';

const LOCAL_PRODUCTS_KEY = 'rer_catalog_products_v2_final_designs';
const LOCAL_CATEGORIES_KEY = 'rer_catalog_categories_v2_final_designs';
const LOCAL_SETTINGS_KEY = 'rer_store_settings_v2_final_designs';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// -----------------------------------------------------------------------------
// LOCAL PERSISTENCE HELPERS (Used when Supabase env vars are not yet configured)
// -----------------------------------------------------------------------------
function readLocalCategories(): Category[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_CATEGORIES;
  try {
    const raw = window.localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(INITIAL_SAMPLE_CATEGORIES));
      return INITIAL_SAMPLE_CATEGORIES;
    }
    return JSON.parse(raw) as Category[];
  } catch {
    return INITIAL_SAMPLE_CATEGORIES;
  }
}

function writeLocalCategories(categories: Category[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(categories));
}

function readLocalProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_PRODUCTS;
  try {
    const raw = window.localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(INITIAL_SAMPLE_PRODUCTS));
      return INITIAL_SAMPLE_PRODUCTS;
    }
    return JSON.parse(raw) as Product[];
  } catch {
    return INITIAL_SAMPLE_PRODUCTS;
  }
}

function writeLocalProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

function readLocalSettings(): StoreSettings {
  if (typeof window === 'undefined') return INITIAL_STORE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(INITIAL_STORE_SETTINGS));
      return INITIAL_STORE_SETTINGS;
    }
    return { ...INITIAL_STORE_SETTINGS, ...(JSON.parse(raw) as Partial<StoreSettings>) };
  } catch {
    return INITIAL_STORE_SETTINGS;
  }
}

function writeLocalSettings(settings: StoreSettings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
}

function attachCategoryRelations(products: Product[], categories: Category[]): Product[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    sale_price: product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : null,
    category: categoryMap.get(product.category_id),
    images: [...(product.images || [])].sort((a, b) => a.display_order - b.display_order),
    variants: [...(product.variants || [])],
  }));
}

// -----------------------------------------------------------------------------
// PUBLIC STOREFRONT QUERIES (Enforces active + published filtering)
// -----------------------------------------------------------------------------
export async function fetchPublicStoreSettings(): Promise<StoreSettings> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return readLocalSettings();
  }

  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return readLocalSettings();
  }
  return { ...INITIAL_STORE_SETTINGS, ...(data as StoreSettings) };
}

export async function fetchPublicCategories(): Promise<Category[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories().filter((c) => c.is_active);
    const publicProducts = readLocalProducts().filter((p) => p.is_published && p.is_active);
    return categories.map((cat) => ({
      ...cat,
      product_count: publicProducts.filter((p) => p.category_id === cat.id).length,
    }));
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const { data: productCounts } = await supabase
    .from('products')
    .select('id, category_id')
    .eq('is_published', true)
    .eq('is_active', true);

  return ((categories as Category[]) || []).map((cat) => ({
    ...cat,
    product_count: (productCounts || []).filter((p) => p.category_id === cat.id).length,
  }));
}

export async function fetchPublicProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    const activeCatIds = new Set(categories.filter((c) => c.is_active).map((c) => c.id));
    const products = readLocalProducts().filter(
      (p) => p.is_published && p.is_active && activeCatIds.has(p.category_id)
    );
    return attachCategoryRelations(products, categories).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `
    )
    .eq('is_published', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return ((data as Product[]) || [])
    .filter((p) => !p.category || p.category.is_active)
    .map((p) => ({
      ...p,
      price: Number(p.price),
      sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
      images: [...(p.images || [])].sort((a, b) => a.display_order - b.display_order),
    }));
}

export async function fetchPublicProductBySlug(slug: string): Promise<Product | null> {
  const cleanSlug = slug.trim().toLowerCase();
  const supabase = getSupabaseClient();

  if (!supabase) {
    const categories = readLocalCategories();
    const products = attachCategoryRelations(readLocalProducts(), categories);
    const match = products.find((p) => p.slug.toLowerCase() === cleanSlug);
    // Draft or unpublished products must not be exposed as orderable public products
    if (!match || !match.is_published || !match.is_active) {
      return null;
    }
    if (match.category && !match.category.is_active) {
      return null;
    }
    return match;
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `
    )
    .eq('slug', cleanSlug)
    .eq('is_published', true)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product details: ${error.message}`);
  }
  if (!data) return null;

  const product = data as Product;
  if (product.category && !product.category.is_active) {
    return null;
  }

  return {
    ...product,
    price: Number(product.price),
    sale_price: product.sale_price !== null ? Number(product.sale_price) : null,
    images: [...(product.images || [])].sort((a, b) => a.display_order - b.display_order),
  };
}

// -----------------------------------------------------------------------------
// ADMIN QUERIES & MUTATIONS (Requires verified admin session)
// -----------------------------------------------------------------------------
export async function fetchAdminProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    return attachCategoryRelations(readLocalProducts(), categories).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `
    )
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin catalog: ${error.message}`);
  }

  return ((data as Product[]) || []).map((p) => ({
    ...p,
    price: Number(p.price),
    sale_price: p.sale_price !== null ? Number(p.sale_price) : null,
    images: [...(p.images || [])].sort((a, b) => a.display_order - b.display_order),
  }));
}

export async function fetchAdminProductById(id: string): Promise<Product | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    const products = attachCategoryRelations(readLocalProducts(), categories);
    return products.find((p) => p.id === id) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }
  if (!data) return null;

  const product = data as Product;
  return {
    ...product,
    price: Number(product.price),
    sale_price: product.sale_price !== null ? Number(product.sale_price) : null,
    images: [...(product.images || [])].sort((a, b) => a.display_order - b.display_order),
  };
}

export async function fetchAdminCategories(): Promise<Category[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    const products = readLocalProducts();
    return categories.map((c) => ({
      ...c,
      product_count: products.filter((p) => p.category_id === c.id).length,
    }));
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const { data: products } = await supabase.from('products').select('id, category_id');

  return ((categories as Category[]) || []).map((c) => ({
    ...c,
    product_count: (products || []).filter((p) => p.category_id === c.id).length,
  }));
}

export async function computeDashboardStatistics(): Promise<DashboardStatistics> {
  const [products, categories] = await Promise.all([
    fetchAdminProducts(),
    fetchAdminCategories(),
  ]);

  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.is_published && p.is_active).length;
  const draftProducts = products.filter((p) => !p.is_published).length;
  const activeCategories = categories.filter((c) => c.is_active).length;

  const unavailableProducts = products.filter((p) => {
    if (!p.is_active) return true;
    if (!p.variants || p.variants.length === 0) return true;
    return p.variants.every(
      (v) => !v.is_available || (v.stock_quantity !== null && v.stock_quantity <= 0)
    );
  }).length;

  let hasConfiguredStock = false;
  let lowStockProducts = 0;

  for (const product of products) {
    const stockVariants = (product.variants || []).filter(
      (v) => v.stock_quantity !== null && v.stock_quantity !== undefined
    );
    if (stockVariants.length > 0) {
      hasConfiguredStock = true;
      const totalStock = stockVariants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
      if (totalStock > 0 && totalStock <= 5) {
        lowStockProducts += 1;
      }
    }
  }

  const recentlyUpdatedProducts = [...products]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  return {
    totalProducts,
    publishedProducts,
    draftProducts,
    activeCategories,
    unavailableProducts,
    lowStockProducts,
    hasConfiguredStock,
    recentlyUpdatedProducts,
  };
}

// -----------------------------------------------------------------------------
// VALIDATION HELPERS FOR PRODUCT & CATEGORY CRUD
// -----------------------------------------------------------------------------
export function validateProductInput(input: ProductInput): void {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Product name is required (at least 2 characters).');
  }
  if (!input.slug || !isValidSlug(input.slug)) {
    throw new Error('A valid lowercase hyphenated URL slug is required (e.g. noor-e-sahar-suit).');
  }
  if (!input.category_id) {
    throw new Error('Please select a product category.');
  }
  if (Number.isNaN(Number(input.price)) || Number(input.price) < 0) {
    throw new Error('Regular price must be a valid non-negative amount in PKR.');
  }
  if (input.sale_price !== null && input.sale_price !== undefined) {
    if (Number(input.sale_price) < 0 || Number(input.sale_price) >= Number(input.price)) {
      throw new Error('Sale price must be lower than the regular price.');
    }
  }
  if (!input.variants || input.variants.length === 0) {
    throw new Error('Please configure at least one clothing variant (size/color).');
  }
  if (!input.images || input.images.length === 0) {
    throw new Error('Please provide at least one product image.');
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  validateProductInput(input);
  const cleanSlug = input.slug.trim().toLowerCase();
  const supabase = getSupabaseClient();

  if (!supabase) {
    const existing = readLocalProducts();
    if (existing.some((p) => p.slug.toLowerCase() === cleanSlug)) {
      throw new Error(`A product with the slug "${cleanSlug}" already exists. Please choose a unique slug.`);
    }

    const now = new Date().toISOString();
    const productId = generateUuid();

    const normalizedImages: ProductImage[] = input.images.map((img, idx) => ({
      id: generateUuid(),
      product_id: productId,
      storage_path: img.storage_path,
      alt_text: img.alt_text || input.name,
      display_order: idx,
      is_primary: idx === 0 ? true : Boolean(img.is_primary),
      created_at: now,
    }));

    if (!normalizedImages.some((i) => i.is_primary) && normalizedImages.length > 0) {
      normalizedImages[0].is_primary = true;
    }

    const normalizedVariants: ProductVariant[] = input.variants.map((v) => ({
      id: generateUuid(),
      product_id: productId,
      size: v.size || null,
      color: v.color || null,
      sku: v.sku || null,
      stock_quantity: v.stock_quantity !== null && v.stock_quantity !== undefined ? Number(v.stock_quantity) : null,
      is_available: Boolean(v.is_available),
      created_at: now,
      updated_at: now,
    }));

    const newProduct: Product = {
      id: productId,
      name: input.name.trim(),
      slug: cleanSlug,
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      category_id: input.category_id,
      price: Number(input.price),
      sale_price: input.sale_price !== null ? Number(input.sale_price) : null,
      sku: input.sku?.trim() || null,
      is_featured: Boolean(input.is_featured),
      is_active: Boolean(input.is_active),
      is_published: Boolean(input.is_published),
      created_at: now,
      updated_at: now,
      variants: normalizedVariants,
      images: normalizedImages,
    };

    const nextProducts = [newProduct, ...existing];
    writeLocalProducts(nextProducts);
    return attachCategoryRelations([newProduct], readLocalCategories())[0];
  }

  // Check duplicate slug in Supabase
  const { data: slugCollision } = await supabase
    .from('products')
    .select('id')
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (slugCollision) {
    throw new Error(`A product with the slug "${cleanSlug}" already exists. Please choose a unique slug.`);
  }

  const { data: insertedProduct, error: productError } = await supabase
    .from('products')
    .insert({
      name: input.name.trim(),
      slug: cleanSlug,
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      category_id: input.category_id,
      price: Number(input.price),
      sale_price: input.sale_price !== null ? Number(input.sale_price) : null,
      sku: input.sku?.trim() || null,
      is_featured: Boolean(input.is_featured),
      is_active: Boolean(input.is_active),
      is_published: Boolean(input.is_published),
    })
    .select('*')
    .single();

  if (productError || !insertedProduct) {
    throw new Error(productError?.message || 'Failed to create product.');
  }

  const productId = insertedProduct.id as string;

  if (input.variants.length > 0) {
    const { error: variantsError } = await supabase.from('product_variants').insert(
      input.variants.map((v) => ({
        product_id: productId,
        size: v.size || null,
        color: v.color || null,
        sku: v.sku?.trim() || null,
        stock_quantity:
          v.stock_quantity !== null && v.stock_quantity !== undefined ? Number(v.stock_quantity) : null,
        is_available: Boolean(v.is_available),
      }))
    );

    if (variantsError) {
      throw new Error(`Product created, but saving variants failed: ${variantsError.message}`);
    }
  }

  if (input.images.length > 0) {
    const hasPrimary = input.images.some((i) => i.is_primary);
    const { error: imagesError } = await supabase.from('product_images').insert(
      input.images.map((img, idx) => ({
        product_id: productId,
        storage_path: img.storage_path,
        alt_text: img.alt_text || input.name.trim(),
        display_order: idx,
        is_primary: hasPrimary ? Boolean(img.is_primary) : idx === 0,
      }))
    );

    if (imagesError) {
      throw new Error(`Product created, but saving images failed: ${imagesError.message}`);
    }
  }

  const created = await fetchAdminProductById(productId);
  if (!created) {
    throw new Error('Failed to retrieve newly created product.');
  }
  return created;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  validateProductInput(input);
  const cleanSlug = input.slug.trim().toLowerCase();
  const supabase = getSupabaseClient();

  if (!supabase) {
    const existing = readLocalProducts();
    const targetIndex = existing.findIndex((p) => p.id === id);
    if (targetIndex === -1) {
      throw new Error('Product not found.');
    }

    if (existing.some((p) => p.id !== id && p.slug.toLowerCase() === cleanSlug)) {
      throw new Error(`Another product is already using the slug "${cleanSlug}".`);
    }

    const now = new Date().toISOString();
    const prevProduct = existing[targetIndex];

    // Determine removed images so we can clean them up safely if not shared
    const nextPaths = new Set(input.images.map((i) => i.storage_path));
    const removedImages = prevProduct.images.filter((oldImg) => !nextPaths.has(oldImg.storage_path));
    for (const removed of removedImages) {
      await safelyDeleteStorageObjectIfUnshared(removed.storage_path, id);
    }

    const hasPrimary = input.images.some((i) => i.is_primary);
    const updatedImages: ProductImage[] = input.images.map((img, idx) => ({
      id: generateUuid(),
      product_id: id,
      storage_path: img.storage_path,
      alt_text: img.alt_text || input.name.trim(),
      display_order: idx,
      is_primary: hasPrimary ? Boolean(img.is_primary) : idx === 0,
      created_at: now,
    }));

    const updatedVariants: ProductVariant[] = input.variants.map((v) => ({
      id: generateUuid(),
      product_id: id,
      size: v.size || null,
      color: v.color || null,
      sku: v.sku?.trim() || null,
      stock_quantity:
        v.stock_quantity !== null && v.stock_quantity !== undefined ? Number(v.stock_quantity) : null,
      is_available: Boolean(v.is_available),
      created_at: now,
      updated_at: now,
    }));

    const updatedProduct: Product = {
      ...prevProduct,
      name: input.name.trim(),
      slug: cleanSlug,
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      category_id: input.category_id,
      price: Number(input.price),
      sale_price: input.sale_price !== null ? Number(input.sale_price) : null,
      sku: input.sku?.trim() || null,
      is_featured: Boolean(input.is_featured),
      is_active: Boolean(input.is_active),
      is_published: Boolean(input.is_published),
      updated_at: now,
      variants: updatedVariants,
      images: updatedImages,
    };

    const nextProducts = [...existing];
    nextProducts[targetIndex] = updatedProduct;
    writeLocalProducts(nextProducts);
    return attachCategoryRelations([updatedProduct], readLocalCategories())[0];
  }

  // Check slug uniqueness excluding current product
  const { data: slugCollision } = await supabase
    .from('products')
    .select('id')
    .eq('slug', cleanSlug)
    .neq('id', id)
    .maybeSingle();

  if (slugCollision) {
    throw new Error(`Another product is already using the slug "${cleanSlug}".`);
  }

  const prevProduct = await fetchAdminProductById(id);
  if (!prevProduct) {
    throw new Error('Product not found.');
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({
      name: input.name.trim(),
      slug: cleanSlug,
      short_description: input.short_description.trim(),
      description: input.description.trim(),
      category_id: input.category_id,
      price: Number(input.price),
      sale_price: input.sale_price !== null ? Number(input.sale_price) : null,
      sku: input.sku?.trim() || null,
      is_featured: Boolean(input.is_featured),
      is_active: Boolean(input.is_active),
      is_published: Boolean(input.is_published),
    })
    .eq('id', id);

  if (updateError) {
    throw new Error(`Failed to update product: ${updateError.message}`);
  }

  // Replace variants cleanly
  const { error: delVarError } = await supabase
    .from('product_variants')
    .delete()
    .eq('product_id', id);
  if (delVarError) {
    throw new Error(`Failed to update variants: ${delVarError.message}`);
  }

  const { error: insVarError } = await supabase.from('product_variants').insert(
    input.variants.map((v) => ({
      product_id: id,
      size: v.size || null,
      color: v.color || null,
      sku: v.sku?.trim() || null,
      stock_quantity:
        v.stock_quantity !== null && v.stock_quantity !== undefined ? Number(v.stock_quantity) : null,
      is_available: Boolean(v.is_available),
    }))
  );
  if (insVarError) {
    throw new Error(`Failed to save updated variants: ${insVarError.message}`);
  }

  // Replace image rows & clean up unreferenced storage objects safely
  const nextPaths = new Set(input.images.map((i) => i.storage_path));
  const removedImages = prevProduct.images.filter((oldImg) => !nextPaths.has(oldImg.storage_path));

  const { error: delImgError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', id);
  if (delImgError) {
    throw new Error(`Failed to update product images: ${delImgError.message}`);
  }

  const hasPrimary = input.images.some((i) => i.is_primary);
  const { error: insImgError } = await supabase.from('product_images').insert(
    input.images.map((img, idx) => ({
      product_id: id,
      storage_path: img.storage_path,
      alt_text: img.alt_text || input.name.trim(),
      display_order: idx,
      is_primary: hasPrimary ? Boolean(img.is_primary) : idx === 0,
    }))
  );
  if (insImgError) {
    throw new Error(`Failed to save updated product images: ${insImgError.message}`);
  }

  for (const removed of removedImages) {
    await safelyDeleteStorageObjectIfUnshared(removed.storage_path, id);
  }

  const updated = await fetchAdminProductById(id);
  if (!updated) {
    throw new Error('Failed to load updated product.');
  }
  return updated;
}

/**
 * Quick status toggle (publish/unpublish, active/inactive, featured/unfeatured)
 */
export async function updateProductStatusFlags(
  id: string,
  flags: Partial<Pick<Product, 'is_published' | 'is_active' | 'is_featured'>>
): Promise<Product> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const products = readLocalProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found.');
    const updated: Product = {
      ...products[index],
      ...flags,
      updated_at: new Date().toISOString(),
    };
    products[index] = updated;
    writeLocalProducts(products);
    return attachCategoryRelations([updated], readLocalCategories())[0];
  }

  const { error } = await supabase.from('products').update(flags).eq('id', id);
  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`);
  }
  const updated = await fetchAdminProductById(id);
  if (!updated) throw new Error('Product not found after update.');
  return updated;
}

/**
 * Safely deletes a Storage object ONLY if it is inside Supabase Storage (not a local `/images/`
 * static asset) AND is not referenced by any other product in `product_images`.
 */
export async function safelyDeleteStorageObjectIfUnshared(
  storagePath: string,
  excludingProductId: string
): Promise<boolean> {
  if (
    !storagePath ||
    storagePath.startsWith('/') ||
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:')
  ) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { data: otherReferences, error: refError } = await supabase
    .from('product_images')
    .select('id')
    .eq('storage_path', storagePath)
    .neq('product_id', excludingProductId)
    .limit(1);

  if (refError || (otherReferences && otherReferences.length > 0)) {
    // Shared by another product — do not delete the file from Storage
    return false;
  }

  const { error: storageError } = await supabase.storage
    .from(BRAND_CONFIG.storageBucket)
    .remove([storagePath]);

  return !storageError;
}

/**
 * Deletes a product and cleans up its unshared images safely
 */
export async function deleteProduct(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const products = readLocalProducts();
    const target = products.find((p) => p.id === id);
    if (!target) {
      throw new Error('Product not found.');
    }
    const remaining = products.filter((p) => p.id !== id);
    writeLocalProducts(remaining);
    return;
  }

  const target = await fetchAdminProductById(id);
  if (!target) {
    throw new Error('Product not found.');
  }

  const imagePaths = target.images.map((i) => i.storage_path);

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  for (const path of imagePaths) {
    await safelyDeleteStorageObjectIfUnshared(path, id);
  }
}

// -----------------------------------------------------------------------------
// CATEGORY CRUD WITH SAFE ORPHAN PREVENTION
// -----------------------------------------------------------------------------
export async function createCategory(input: CategoryInput): Promise<Category> {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Category name is required.');
  }
  const cleanSlug = input.slug.trim().toLowerCase();
  if (!isValidSlug(cleanSlug)) {
    throw new Error('Please enter a valid lowercase hyphenated slug.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    if (categories.some((c) => c.slug.toLowerCase() === cleanSlug)) {
      throw new Error(`A category with the slug "${cleanSlug}" already exists.`);
    }
    const now = new Date().toISOString();
    const newCategory: Category = {
      id: generateUuid(),
      name: input.name.trim(),
      slug: cleanSlug,
      description: input.description.trim(),
      image_url: input.image_url.trim() || '/images/sample/category-festive.svg',
      is_active: Boolean(input.is_active),
      created_at: now,
      updated_at: now,
      product_count: 0,
    };
    writeLocalCategories([...categories, newCategory]);
    return newCategory;
  }

  const { data: existingSlug } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (existingSlug) {
    throw new Error(`A category with the slug "${cleanSlug}" already exists.`);
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: input.name.trim(),
      slug: cleanSlug,
      description: input.description.trim(),
      image_url: input.image_url.trim() || '/images/sample/category-festive.svg',
      is_active: Boolean(input.is_active),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create category.');
  }
  return { ...(data as Category), product_count: 0 };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Category name is required.');
  }
  const cleanSlug = input.slug.trim().toLowerCase();
  if (!isValidSlug(cleanSlug)) {
    throw new Error('Please enter a valid lowercase hyphenated slug.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const categories = readLocalCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Category not found.');
    if (categories.some((c) => c.id !== id && c.slug.toLowerCase() === cleanSlug)) {
      throw new Error(`Another category is already using the slug "${cleanSlug}".`);
    }

    const products = readLocalProducts();
    const updated: Category = {
      ...categories[index],
      name: input.name.trim(),
      slug: cleanSlug,
      description: input.description.trim(),
      image_url: input.image_url.trim() || categories[index].image_url,
      is_active: Boolean(input.is_active),
      updated_at: new Date().toISOString(),
      product_count: products.filter((p) => p.category_id === id).length,
    };
    categories[index] = updated;
    writeLocalCategories(categories);
    return updated;
  }

  const { data: slugCollision } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', cleanSlug)
    .neq('id', id)
    .maybeSingle();

  if (slugCollision) {
    throw new Error(`Another category is already using the slug "${cleanSlug}".`);
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: input.name.trim(),
      slug: cleanSlug,
      description: input.description.trim(),
      image_url: input.image_url.trim(),
      is_active: Boolean(input.is_active),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to update category.');
  }
  return data as Category;
}

/**
 * Deletes a category safely.
 * Prevents deletion if products are still assigned unless `reassignToCategoryId` is provided.
 */
export async function deleteCategorySafely(
  id: string,
  reassignToCategoryId?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    const categories = readLocalCategories();
    const products = readLocalProducts();
    const associated = products.filter((p) => p.category_id === id);

    if (associated.length > 0) {
      if (!reassignToCategoryId || reassignToCategoryId === id) {
        throw new Error(
          `Cannot delete this category because ${associated.length} product(s) are assigned to it. Please reassign those products to another category first.`
        );
      }
      const targetCat = categories.find((c) => c.id === reassignToCategoryId);
      if (!targetCat) {
        throw new Error('Selected reassignment category does not exist.');
      }
      const reassignedProducts = products.map((p) =>
        p.category_id === id ? { ...p, category_id: reassignToCategoryId } : p
      );
      writeLocalProducts(reassignedProducts);
    }

    writeLocalCategories(categories.filter((c) => c.id !== id));
    return;
  }

  const { data: associatedProducts, error: countError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', id);

  if (countError) {
    throw new Error(`Failed to verify category products: ${countError.message}`);
  }

  if (associatedProducts && associatedProducts.length > 0) {
    if (!reassignToCategoryId || reassignToCategoryId === id) {
      throw new Error(
        `Cannot delete this category because ${associatedProducts.length} product(s) are assigned to it. Please select a target category to reassign them first.`
      );
    }

    const { error: reassignError } = await supabase
      .from('products')
      .update({ category_id: reassignToCategoryId })
      .eq('category_id', id);

    if (reassignError) {
      throw new Error(`Failed to reassign products: ${reassignError.message}`);
    }
  }

  const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
  if (deleteError) {
    throw new Error(`Failed to delete category: ${deleteError.message}`);
  }
}

// -----------------------------------------------------------------------------
// STORE SETTINGS UPDATE
// -----------------------------------------------------------------------------
export async function updateStoreSettings(
  updates: Partial<Omit<StoreSettings, 'id' | 'updated_at'>>
): Promise<StoreSettings> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const current = readLocalSettings();
    const next: StoreSettings = {
      ...current,
      ...updates,
      id: 1,
      updated_at: new Date().toISOString(),
    };
    writeLocalSettings(next);
    return next;
  }

  const { data, error } = await supabase
    .from('store_settings')
    .upsert({
      id: 1,
      ...updates,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save store settings.');
  }
  return data as StoreSettings;
}

// -----------------------------------------------------------------------------
// IMAGE UPLOAD WORKFLOW (Optimizes to WebP & uploads to Supabase Storage or Data URL)
// -----------------------------------------------------------------------------
export async function uploadProductImageFile(
  file: File,
  productSlug: string,
  onProgress?: (percent: number) => void
): Promise<{ storagePath: string; publicUrl: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  onProgress?.(20);
  const optimizedFile = await optimizeImageForUpload(file);
  onProgress?.(55);

  const supabase = getSupabaseClient();
  if (!supabase) {
    // Convert to persistent Data URL for local development preview mode
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(optimizedFile);
    });
    onProgress?.(100);
    return {
      storagePath: dataUrl,
      publicUrl: dataUrl,
    };
  }

  const objectPath = buildSafeStorageObjectPath(productSlug, optimizedFile.name);
  const { error: uploadError } = await supabase.storage
    .from(BRAND_CONFIG.storageBucket)
    .upload(objectPath, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: optimizedFile.type,
    });

  if (uploadError) {
    throw new Error(`Image upload failed: ${uploadError.message}`);
  }

  onProgress?.(100);
  const { data } = supabase.storage.from(BRAND_CONFIG.storageBucket).getPublicUrl(objectPath);

  return {
    storagePath: objectPath,
    publicUrl: data.publicUrl,
  };
}
