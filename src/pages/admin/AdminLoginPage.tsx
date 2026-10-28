import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, ArrowLeft, ShieldCheck, Database } from 'lucide-react';
import { useAdminAuth } from '@/features/admin/AdminAuthContext';
import { BRAND_CONFIG, isSupabaseConfigured } from '@/lib/config';
import { DocumentHead } from '@/components/DocumentHead';

export const AdminLoginPage: React.FC = () => {
  const { adminUser, loginWithEmail, activateLocalPreview } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (adminUser) {
    return <Navigate to="/admin" replace />;
  }

  const supabaseConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartLocalSandbox = () => {
    try {
      activateLocalPreview(email || BRAND_CONFIG.businessEmail);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start local preview.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <DocumentHead title="Admin Login | Rang e Rosh" noIndex />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex flex-col items-center gap-2">
          <img
            src={BRAND_CONFIG.logoPath}
            alt="Rang e Rosh Logo"
            className="h-16 w-16 rounded-full object-cover border-2 border-[#B8860B]"
          />
          <span className="font-serif text-3xl tracking-widest text-[#1E1E24] mt-1">
            Rang e Rosh
          </span>
        </Link>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Authorized Administrator Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-[#E5DDD0] py-8 px-6 shadow-xs sm:px-10 space-y-6">
          <div className="flex items-center gap-2 text-xs text-[#5A5A66] border-b border-[#F0EAE1] pb-4">
            <ShieldCheck className="h-4 w-4 text-[#9E4769] shrink-0" />
            <span>
              Protected by Supabase Auth & explicit <code className="font-mono">admin_users</code>{' '}
              Row Level Security. No public registration is permitted.
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 border border-red-300 bg-red-50 p-3.5 text-xs text-red-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={BRAND_CONFIG.businessEmail}
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E24] text-white px-6 py-3.5 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {submitting ? 'Signing In...' : 'Sign In with Supabase Auth'}
            </button>
          </form>

          {/* Local Development Sandbox Notice when Supabase env vars are not yet configured */}
          {!supabaseConfigured && (
            <div className="pt-5 border-t border-[#E5DDD0] space-y-3">
              <div className="bg-[#FAF7F2] border border-[#B8860B]/40 p-3.5 text-xs text-[#4A4A55] space-y-1.5">
                <p className="font-semibold text-[#3B0A45] flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-[#B8860B]" />
                  Local Development Sandbox Mode
                </p>
                <p>
                  <code className="font-mono text-[11px]">VITE_SUPABASE_URL</code> is not configured
                  in <code className="font-mono text-[11px]">.env.local</code> yet. You can preview
                  and test the complete Admin Dashboard (Product CRUD, Category CRUD, Image Upload,
                  and Store Settings) locally in your browser right now.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartLocalSandbox}
                className="w-full border border-[#3B0A45] bg-[#FAF7F2] text-[#3B0A45] px-4 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#3B0A45] hover:text-white transition-colors"
              >
                Enter Local Admin Sandbox Preview
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-[#F0EAE1] text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#6E6A63] hover:text-[#9E4769]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Public Storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
