import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star,
  AlertTriangle,
} from 'lucide-react';
import {
  deleteProduct,
  fetchAdminCategories,
  fetchAdminProducts,
  updateProductStatusFlags,
} from '@/services/catalogService';
import type { Category, Product } from '@/types';
import { formatPKR } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';
import { useStore } from '@/app/StoreContext';

export const AdminProductsPage: React.FC = () => {
  const { refreshStoreData } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'unavailable'>(
    'all'
  );

  // Delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) {
        return false;
      }
      const hasAvailableVariant = p.variants.some(
        (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
      );
      const isAvailable = p.is_active && hasAvailableVariant;

      if (statusFilter === 'published' && !p.is_published) return false;
      if (statusFilter === 'draft' && p.is_published) return false;
      if (statusFilter === 'unavailable' && isAvailable) return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSlug) return false;
      }
      return true;
    });
  }, [products, categoryFilter, statusFilter, searchQuery]);

  const handleToggleFlag = async (
    product: Product,
    field: 'is_published' | 'is_active' | 'is_featured'
  ) => {
    setError(null);
    setFeedback(null);
    try {
      const nextVal = !product[field];
      const updated = await updateProductStatusFlags(product.id, { [field]: nextVal });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      await refreshStoreData();
      setFeedback(`Updated "${product.name}" status.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setError(null);
    setFeedback(null);
    try {
      await deleteProduct(productToDelete.id);
      const deletedName = productToDelete.name;
      setProductToDelete(null);
      await loadCatalog();
      await refreshStoreData();
      setFeedback(`Deleted "${deletedName}" and cleaned up unshared assets.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
            Catalog Management
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24] mt-1">
            Products ({products.length})
          </h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#9E4769] transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          Add New Product
        </Link>
      </div>

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className="border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900"
        >
          {feedback}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white border border-[#E5DDD0] p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-5 relative">
          <label htmlFor="admin-product-search" className="sr-only">
            Search products
          </label>
          <Search className="h-4 w-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="admin-product-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, SKU, or slug..."
            className="w-full border border-[#D6CEC2] bg-[#FAF7F2] pl-10 pr-4 py-2 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
          />
        </div>

        <div className="md:col-span-4">
          <label htmlFor="admin-category-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="admin-status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | 'published' | 'draft' | 'unavailable'
              )
            }
            className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
            <option value="unavailable">Unavailable / Sold Out</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#E5DDD0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs uppercase tracking-widest text-[#6E6A63]">
            Loading catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="font-serif text-2xl text-[#1E1E24]">No matching products found</p>
            <p className="text-xs text-[#6E6A63]">
              Adjust your search filters or add a new suit to the catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63]">
                  <th className="py-3.5 px-4">Suit</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Regular Price</th>
                  <th className="py-3.5 px-4">Sale Price</th>
                  <th className="py-3.5 px-4">Publication</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4">Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]">
                {filteredProducts.map((product) => {
                  const thumb =
                    product.images.find((i) => i.is_primary) || product.images[0];
                  const availableVariantCount = product.variants.filter(
                    (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
                  ).length;
                  const isAvailable = product.is_active && availableVariantCount > 0;

                  return (
                    <tr key={product.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              thumb
                                ? resolveProductImageUrl(thumb.storage_path)
                                : '/images/sample/product-1.svg'
                            }
                            alt={product.name}
                            className="h-14 w-11 object-cover border border-[#E5DDD0] bg-[#F0EAE1] shrink-0"
                          />
                          <div>
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="font-medium text-[#1E1E24] hover:text-[#9E4769] block"
                            >
                              {product.name}
                            </Link>
                            <span className="text-[11px] text-[#8C857B]">
                              {product.sku ? `SKU: ${product.sku} • ` : ''}
                              {product.variants.length} variant(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#5A5A66]">
                        {product.category?.name || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-[#1E1E24]">
                        {formatPKR(product.price)}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {product.sale_price !== null ? (
                          <span className="font-semibold text-[#9E4769]">
                            {formatPKR(product.sale_price)}
                          </span>
                        ) : (
                          <span className="text-[#8C857B]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(product, 'is_published')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border ${
                            product.is_published
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                          title="Click to toggle Published / Draft status"
                        >
                          {product.is_published ? (
                            <>
                              <Eye className="h-3 w-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Draft
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(product, 'is_active')}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border ${
                            isAvailable
                              ? 'bg-[#2D6A73]/10 text-[#2D6A73] border-[#2D6A73]/30'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                          title="Click to activate or deactivate availability"
                        >
                          {isAvailable ? `Active (${availableVariantCount})` : 'Unavailable'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(product, 'is_featured')}
                          className={`p-1.5 rounded-xs border ${
                            product.is_featured
                              ? 'border-[#B8860B] bg-[#B8860B]/15 text-[#B8860B]'
                              : 'border-transparent text-[#C8BFAF] hover:text-[#1E1E24]'
                          }`}
                          aria-label={`Toggle featured status for ${product.name}`}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#6E6A63]">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="p-1.5 text-[#1E1E24] hover:text-[#9E4769] border border-[#E5DDD0] bg-[#FAF7F2]"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 text-red-700 hover:bg-red-50 border border-[#E5DDD0] bg-[#FAF7F2]"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog (Requirement 10) */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E24]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-dialog-title"
        >
          <div className="bg-white border border-[#E5DDD0] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-700 shrink-0 mt-0.5" />
              <div>
                <h2
                  id="delete-product-dialog-title"
                  className="font-serif text-2xl font-medium text-[#1E1E24]"
                >
                  Confirm Product Deletion
                </h2>
                <p className="text-xs text-[#5A5A66] mt-1">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#1E1E24]">“{productToDelete.name}”</strong> (Slug:{' '}
                  <code className="font-mono">{productToDelete.slug}</code>)?
                </p>
                <p className="text-xs text-[#6E6A63] mt-2">
                  This will remove the product, its clothing variants, and any unshared product
                  images. Shared image files used by other products will be preserved safely.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DDD0]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setProductToDelete(null)}
                className="border border-[#D6CEC2] bg-[#FAF7F2] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:bg-[#F0EAE1]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="bg-red-700 text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-red-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
