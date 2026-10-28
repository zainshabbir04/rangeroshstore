import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDashboardStatistics,
  createCategory,
  createProduct,
  deleteCategorySafely,
  deleteProduct,
  fetchAdminCategories,
  fetchPublicProductBySlug,
  fetchPublicProducts,
  updateCategory,
  updateProduct,
} from '@/services/catalogService';
import {
  getCurrentAdminSession,
  signOutAdmin,
  startLocalDevelopmentAdminPreview,
  verifyExplicitAdminAuthorization,
} from '@/services/authService';
import { validateImageFile } from '@/utils/imageOptimizer';

describe('Catalog CRUD, Orphan Guards, Draft Isolation & Security Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('loads the initial 8 sample products and 4 active categories', async () => {
    const products = await fetchPublicProducts();
    const categories = await fetchAdminCategories();
    expect(products).toHaveLength(8);
    expect(categories).toHaveLength(4);
  });

  it('creates, edits, unpublishes (draft), and deletes a product while preventing public exposure of drafts', async () => {
    const categories = await fetchAdminCategories();
    const firstCat = categories[0];

    // 1. Create a Draft product
    const created = await createProduct({
      name: 'Sehar Festive Silk Suit [Sample]',
      slug: 'sehar-festive-silk-suit',
      short_description: 'Hand-worked silk suit',
      description: 'Full description of Sehar suit',
      category_id: firstCat.id,
      price: 11500,
      sale_price: 9900,
      sku: 'RER-TEST-009',
      is_featured: false,
      is_active: true,
      is_published: false, // Draft!
      variants: [
        {
          size: 'Medium',
          color: 'Warm Ivory',
          sku: 'RER-TEST-009-M',
          stock_quantity: 4,
          is_available: true,
        },
      ],
      images: [
        {
          storage_path: '/images/sample/product-1.svg',
          alt_text: 'Sehar Suit',
          display_order: 0,
          is_primary: true,
        },
      ],
    });

    expect(created.id).toBeDefined();
    expect(created.is_published).toBe(false);

    // 2. Verify Draft product is NOT exposed in public queries
    const publicLookupDraft = await fetchPublicProductBySlug('sehar-festive-silk-suit');
    expect(publicLookupDraft).toBeNull();

    // 3. Reject duplicate slug creation
    await expect(
      createProduct({
        name: 'Duplicate Slug Suit',
        slug: 'sehar-festive-silk-suit',
        short_description: 'Test',
        description: 'Test',
        category_id: firstCat.id,
        price: 5000,
        sale_price: null,
        sku: null,
        is_featured: false,
        is_active: true,
        is_published: true,
        variants: [{ size: 'Small', color: 'Black', sku: null, stock_quantity: 2, is_available: true }],
        images: [
          {
            storage_path: '/images/sample/product-2.svg',
            alt_text: 'Dup',
            display_order: 0,
            is_primary: true,
          },
        ],
      })
    ).rejects.toThrow(/already exists/i);

    // 4. Publish & Update price of the product
    const updated = await updateProduct(created.id, {
      name: 'Sehar Festive Silk Suit Updated [Sample]',
      slug: 'sehar-festive-silk-suit',
      short_description: 'Updated short description',
      description: 'Updated full description',
      category_id: firstCat.id,
      price: 12000,
      sale_price: 10500,
      sku: 'RER-TEST-009',
      is_featured: true,
      is_active: true,
      is_published: true, // Published!
      variants: [
        {
          size: 'Medium',
          color: 'Warm Ivory',
          sku: 'RER-TEST-009-M',
          stock_quantity: 3,
          is_available: true,
        },
      ],
      images: [
        {
          storage_path: '/images/sample/product-1.svg',
          alt_text: 'Sehar Suit',
          display_order: 0,
          is_primary: true,
        },
      ],
    });

    expect(updated.is_published).toBe(true);
    expect(updated.price).toBe(12000);

    // Now public lookup succeeds
    const publicLookupPublished = await fetchPublicProductBySlug('sehar-festive-silk-suit');
    expect(publicLookupPublished).not.toBeNull();
    expect(publicLookupPublished?.name).toContain('Updated');

    // 5. Delete product and verify it disappears from public catalog
    await deleteProduct(created.id);
    const afterDelete = await fetchPublicProductBySlug('sehar-festive-silk-suit');
    expect(afterDelete).toBeNull();
  });

  it('prevents deleting a category with associated products unless reassigned (orphan prevention)', async () => {
    const categories = await fetchAdminCategories();
    const catWithProducts = categories[0];
    const targetReassignCat = categories[1];

    // Attempting to delete without reassignment must fail
    await expect(deleteCategorySafely(catWithProducts.id)).rejects.toThrow(
      /Cannot delete this category/i
    );

    // Creating a new empty category, editing it, and deleting it succeeds
    const newCat = await createCategory({
      name: 'Velvet Shawls',
      slug: 'velvet-shawls',
      description: 'Winter velvet collection',
      image_url: '/images/sample/category-formals.svg',
      is_active: true,
    });

    const editedCat = await updateCategory(newCat.id, {
      name: 'Heirloom Velvet Shawls',
      slug: 'velvet-shawls',
      description: 'Updated description',
      image_url: '/images/sample/category-formals.svg',
      is_active: true,
    });
    expect(editedCat.name).toBe('Heirloom Velvet Shawls');

    await deleteCategorySafely(newCat.id);
    const remaining = await fetchAdminCategories();
    expect(remaining.some((c) => c.id === newCat.id)).toBe(false);

    // Reassigning products when deleting a populated category succeeds without orphaning products
    await deleteCategorySafely(catWithProducts.id, targetReassignCat.id);
    const allProducts = await fetchPublicProducts();
    expect(allProducts).toHaveLength(8);
  });

  it('computes real dashboard statistics from catalog data', async () => {
    const stats = await computeDashboardStatistics();
    expect(stats.totalProducts).toBe(8);
    expect(stats.publishedProducts).toBe(8);
    expect(stats.draftProducts).toBe(0);
    expect(stats.activeCategories).toBe(4);
    expect(stats.hasConfiguredStock).toBe(true);
  });

  it('validates image file types and size limits before upload', () => {
    const validWebp = new File(['dummy'], 'suit.webp', { type: 'image/webp' });
    expect(validateImageFile(validWebp).valid).toBe(true);

    const invalidExe = new File(['dummy'], 'script.exe', { type: 'application/x-msdownload' });
    expect(validateImageFile(invalidExe).valid).toBe(false);
  });

  it('enforces explicit admin session checks and clean logout', async () => {
    expect(await getCurrentAdminSession()).toBeNull();
    const unauthorizedCheck = await verifyExplicitAdminAuthorization('random-unauthenticated-uuid');
    expect(unauthorizedCheck.authorized).toBe(false);

    const previewSession = startLocalDevelopmentAdminPreview('rangerosh.official@gmail.com');
    expect(previewSession.email).toBe('rangerosh.official@gmail.com');
    expect((await getCurrentAdminSession())?.role).toBe('owner');

    await signOutAdmin();
    expect(await getCurrentAdminSession()).toBeNull();
  });
});
