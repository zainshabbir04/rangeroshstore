import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  FileEdit,
  FolderTree,
  AlertTriangle,
  PlusCircle,
  Settings,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { computeDashboardStatistics } from '@/services/catalogService';
import type { DashboardStatistics } from '@/types';
import { formatPKR, getEffectivePrice } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await computeDashboardStatistics();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
            Rang e Rosh Administration
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24] mt-1">
            Dashboard Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center gap-2 border border-[#D6CEC2] bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#1E1E24] hover:bg-[#FAF7F2]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#9E4769] transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Real Database Statistics Grid */}
      {loading || !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#E5DDD0]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                Total Products
              </p>
              <p className="font-serif text-4xl font-semibold text-[#1E1E24] mt-2">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-[#6E6A63] mt-1">All catalog records</p>
            </div>
            <Package className="h-6 w-6 text-[#9E4769]" />
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                Published Suits
              </p>
              <p className="font-serif text-4xl font-semibold text-emerald-800 mt-2">
                {stats.publishedProducts}
              </p>
              <p className="text-xs text-[#6E6A63] mt-1">Visible on public storefront</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                Draft Products
              </p>
              <p className="font-serif text-4xl font-semibold text-[#B8860B] mt-2">
                {stats.draftProducts}
              </p>
              <p className="text-xs text-[#6E6A63] mt-1">Hidden from public queries</p>
            </div>
            <FileEdit className="h-6 w-6 text-[#B8860B]" />
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                Active Categories
              </p>
              <p className="font-serif text-4xl font-semibold text-[#1E1E24] mt-2">
                {stats.activeCategories}
              </p>
              <p className="text-xs text-[#6E6A63] mt-1">Public navigation collections</p>
            </div>
            <FolderTree className="h-6 w-6 text-[#2D6A73]" />
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                Unavailable Suits
              </p>
              <p className="font-serif text-4xl font-semibold text-red-800 mt-2">
                {stats.unavailableProducts}
              </p>
              <p className="text-xs text-[#6E6A63] mt-1">Inactive or all variants sold out</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-700" />
          </div>

          {stats.hasConfiguredStock && (
            <div className="bg-white border border-[#E5DDD0] p-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A756E]">
                  Low-Stock Products
                </p>
                <p className="font-serif text-4xl font-semibold text-amber-800 mt-2">
                  {stats.lowStockProducts}
                </p>
                <p className="text-xs text-[#6E6A63] mt-1">
                  Configured stock ≤ 5 units across variants
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-[#E5DDD0] p-6 space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#1E1E24]">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2.5 border border-[#D6CEC2] bg-[#FAF7F2] p-4 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:border-[#9E4769] hover:bg-white transition-colors"
          >
            <PlusCircle className="h-4 w-4 text-[#9E4769]" />
            Add Product
          </Link>
          <Link
            to="/admin/products"
            className="flex items-center gap-2.5 border border-[#D6CEC2] bg-[#FAF7F2] p-4 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:border-[#9E4769] hover:bg-white transition-colors"
          >
            <Package className="h-4 w-4 text-[#9E4769]" />
            Manage Products
          </Link>
          <Link
            to="/admin/categories"
            className="flex items-center gap-2.5 border border-[#D6CEC2] bg-[#FAF7F2] p-4 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:border-[#9E4769] hover:bg-white transition-colors"
          >
            <FolderTree className="h-4 w-4 text-[#9E4769]" />
            Manage Categories
          </Link>
          <Link
            to="/admin/settings"
            className="flex items-center gap-2.5 border border-[#D6CEC2] bg-[#FAF7F2] p-4 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:border-[#9E4769] hover:bg-white transition-colors"
          >
            <Settings className="h-4 w-4 text-[#9E4769]" />
            Update Settings
          </Link>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 border border-[#D6CEC2] bg-[#FAF7F2] p-4 text-xs font-semibold uppercase tracking-wider text-[#1E1E24] hover:border-[#9E4769] hover:bg-white transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-[#2D6A73]" />
            Open Storefront
          </Link>
        </div>
      </div>

      {/* Recently Updated Products */}
      {stats && stats.recentlyUpdatedProducts.length > 0 && (
        <div className="bg-white border border-[#E5DDD0] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5DDD0] flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
              Recently Updated Products
            </h2>
            <Link
              to="/admin/products"
              className="text-xs font-semibold uppercase tracking-wider text-[#9E4769] hover:underline"
            >
              View All Products
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E5DDD0] bg-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider text-[#6E6A63]">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD0]">
                {stats.recentlyUpdatedProducts.map((product) => {
                  const thumb =
                    product.images.find((i) => i.is_primary) || product.images[0];
                  return (
                    <tr key={product.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              thumb
                                ? resolveProductImageUrl(thumb.storage_path)
                                : '/images/sample/product-1.svg'
                            }
                            alt={product.name}
                            className="h-12 w-9 object-cover border border-[#E5DDD0] bg-[#F0EAE1]"
                          />
                          <div>
                            <p className="font-medium text-[#1E1E24]">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-[#8C857B]">SKU: {product.sku}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5A5A66]">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#1E1E24]">
                        {formatPKR(getEffectivePrice(product.price, product.sale_price))}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            product.is_published
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {product.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#6E6A63]">
                        {new Date(product.updated_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="text-xs font-semibold uppercase tracking-wider text-[#9E4769] hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
