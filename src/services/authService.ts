// =============================================================================
// RANG E ROSH — ADMIN AUTHENTICATION & EXPLICIT OWNER AUTHORIZATION SERVICE
// =============================================================================
// Security Rules (Requirement 11 & 12):
// - Never rely on user-editable user_metadata for admin permissions.
// - Never assume all authenticated Supabase users are administrators.
// - Verify authenticated user against `public.admin_users` table (`is_active = TRUE`).
// - No hardcoded admin passwords in source code.
// - When Supabase is not yet configured in .env, provides a clearly marked
//   Local Development Preview Session activation (explicitly labeled as local-only
//   sandbox mode) so the developer/owner can test the `/admin` UI before linking
//   their Supabase project.
// =============================================================================

import { getSupabaseClient } from '@/lib/supabase';
import { BRAND_CONFIG, isSupabaseConfigured } from '@/lib/config';

export interface AdminSessionUser {
  id: string;
  email: string;
  role: 'owner' | 'admin';
  isLocalPreviewMode: boolean;
}

const LOCAL_PREVIEW_SESSION_KEY = 'rer_local_admin_preview_session_v1';

/**
 * Checks whether a given authenticated Supabase user ID is an active administrator
 * in the `public.admin_users` table.
 */
export async function verifyExplicitAdminAuthorization(
  userId: string
): Promise<{ authorized: boolean; role?: 'owner' | 'admin'; email?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { authorized: false };
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, email, role, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return { authorized: false };
  }

  return {
    authorized: true,
    role: (data.role as 'owner' | 'admin') || 'admin',
    email: data.email as string,
  };
}

/**
 * Retrieves the currently active and explicitly authorized admin session
 */
export async function getCurrentAdminSession(): Promise<AdminSessionUser | null> {
  if (!isSupabaseConfigured()) {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem(LOCAL_PREVIEW_SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AdminSessionUser;
    } catch {
      return null;
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const verification = await verifyExplicitAdminAuthorization(session.user.id);
  if (!verification.authorized) {
    // Authenticated user is NOT in admin_users -> deny admin access
    return null;
  }

  return {
    id: session.user.id,
    email: verification.email || session.user.email || BRAND_CONFIG.businessEmail,
    role: verification.role || 'owner',
    isLocalPreviewMode: false,
  };
}

/**
 * Signs in an administrator via Supabase Auth and verifies explicit `admin_users` membership
 */
export async function signInAdminWithEmailPassword(
  email: string,
  password: string
): Promise<AdminSessionUser> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both your administrator email and password.');
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured yet. Connect your Supabase project in .env.local or use Local Development Sandbox Mode below to preview the admin dashboard.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Invalid login credentials.');
  }

  const verification = await verifyExplicitAdminAuthorization(data.user.id);
  if (!verification.authorized) {
    // Sign out immediately if user is not an authorized admin
    await supabase.auth.signOut();
    throw new Error(
      'Access denied: Your account is authenticated but is not listed as an active administrator in public.admin_users.'
    );
  }

  return {
    id: data.user.id,
    email: verification.email || data.user.email || cleanEmail,
    role: verification.role || 'owner',
    isLocalPreviewMode: false,
  };
}

/**
 * Activates Local Development Sandbox Mode ONLY when Supabase is not configured in .env.
 * Does NOT use any hardcoded password; explicitly labels the session as local browser preview.
 */
export function startLocalDevelopmentAdminPreview(email?: string): AdminSessionUser {
  if (isSupabaseConfigured()) {
    throw new Error(
      'Local preview mode is disabled when a live Supabase project is configured. Please sign in with your Supabase administrator credentials.'
    );
  }

  const sessionUser: AdminSessionUser = {
    id: 'local-preview-owner',
    email: email?.trim() || BRAND_CONFIG.businessEmail,
    role: 'owner',
    isLocalPreviewMode: true,
  };

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(LOCAL_PREVIEW_SESSION_KEY, JSON.stringify(sessionUser));
  }

  return sessionUser;
}

/**
 * Logs out the current administrator
 */
export async function signOutAdmin(): Promise<void> {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(LOCAL_PREVIEW_SESSION_KEY);
  }
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
}
