import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user for this request — resolved once and shared by the
 * layout, page and data helpers (React `cache`).
 *
 * `getClaims()` verifies the session JWT's signature locally when the project
 * uses asymmetric signing keys (no network round-trip), and falls back to the
 * Auth server otherwise. RLS still enforces access on every query.
 */
export const getAuth = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    supabase,
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  };
});
