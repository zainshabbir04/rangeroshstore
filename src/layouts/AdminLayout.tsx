import React, { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useAdminAuth } from '@/features/admin/AdminAuthContext';
import { BRAND_CONFIG, isSupabaseConfigured } from '@/lib/config';
import { DocumentHead } from '@/components/DocumentHead';

export const AdminLayout: React.FC = () => {
  const { adminUser, loading, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] text-[#1E1E24]">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-[#9E4769] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest text-[#6E6A63]">
            Verifying Administrator Authorization...
          </p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package, end: false },
    { to: '/admin/products/new', label: 'Add Product', icon: PlusCircle, end: true },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree, end: false },
    { to: '/admin/settings', label: 'Store Settings', icon: Settings, end: false },
  ];

  const supabaseConnected = isSupabaseConfigured();

  return (
    <div className="min-h-screen flex bg-[#F4F0EA] text-[#1E1E24]">
      <DocumentHead title="Admin Portal | Rang e Rosh" noIndex />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#1E1E24]/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-[#1E1E24] text-[#FAF7F2] flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <Link to="/admin" className="flex items-center gap-3">
              <img
                src={BRAND_CONFIG.logoPath}
                alt="Rang e Rosh Logo"
                className="h-10 w-10 rounded-full object-cover border border-[#B8860B]"
              />
              <div>
                <span className="block font-serif text-xl tracking-wider text-white leading-none">
                  Rang e Rosh
                </span>
                <span className="block text-[10px] tracking-[0.2em] uppercase text-[#D4AF37] mt-1">
                  Admin Studio
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#CFC9BF] hover:text-white p-1"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Database Connection Mode Indicator */}
          <div className="px-6 py-3 bg-white/5 border-b border-white/10 text-[11px] flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" />
            {supabaseConnected ? (
              <span className="text-emerald-300">Connected: Supabase PostgreSQL</span>
            ) : (
              <span className="text-amber-300">
                Local Sandbox Mode (Persisted in Browser)
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav aria-label="Admin Navigation" className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase transition-colors ${
                      isActive
                        ? 'bg-[#9E4769] text-white'
                        : 'text-[#CFC9BF] hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase text-[#D4AF37] hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span>View Store</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="px-3 py-2 bg-white/5 rounded-xs">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#D4AF37]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Authorized {adminUser.role}</span>
            </div>
            <p className="text-xs text-white truncate mt-0.5" title={adminUser.email}>
              {adminUser.email}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 border border-white/20 px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-[#FAF7F2] hover:bg-red-900/50 hover:border-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile Bar */}
        <header className="bg-white border-b border-[#E5DDD0] px-4 sm:px-8 py-4 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#1E1E24] hover:text-[#9E4769]"
            aria-label="Open admin menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-serif text-xl font-medium text-[#1E1E24]">
            Rang e Rosh Admin
          </span>
          <Link
            to="/"
            className="text-xs uppercase tracking-wider text-[#9E4769] font-semibold"
          >
            Storefront
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
