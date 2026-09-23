/**
 * Central place for Supabase env access + a configured-or-not guard, so the UI
 * can degrade gracefully before real credentials exist.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// Client-safe key. Prefer the new publishable key (sb_publishable_…); fall back
// to the legacy anon key so either naming works. Both are browser-safe: RLS
// scopes data per user once they sign in.
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);
