import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from '@/app/StoreContext';
import { CartProvider } from '@/features/cart/CartContext';
import { AdminAuthProvider } from '@/features/admin/AdminAuthContext';
import { StorefrontLayout } from '@/layouts/StorefrontLayout';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import {
  ContactPage,
  ShippingPolicyPage,
  ReturnsPolicyPage,
  PrivacyPolicyPage,
  TermsPage,
  NotFoundPage,
} from '@/pages/StaticPages';

// Lazy-load admin routes to keep the customer storefront bundle fast and lightweight
const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminProductsPage = lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage }))
);
const AdminProductFormPage = lazy(() =>
  import('@/pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage }))
);
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage }))
);
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#FAF7F2]">
    <div className="text-center space-y-2">
      <div className="h-7 w-7 border-2 border-[#9E4769] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs uppercase tracking-widest text-[#6E6A63]">Loading...</p>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <CartProvider>
          <AdminAuthProvider>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Customer-Facing Storefront Routes */}
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop" element={<ShopPage mode="all" />} />
                  <Route
                    path="/collections/:slug"
                    element={<ShopPage mode="collection" />}
                  />
                  <Route path="/product/:slug" element={<ProductDetailPage />} />
                  <Route path="/search" element={<ShopPage mode="search" />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
                  <Route path="/returns-policy" element={<ReturnsPolicyPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                </Route>
              </Routes>
            </Suspense>
          </AdminAuthProvider>
        </CartProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
