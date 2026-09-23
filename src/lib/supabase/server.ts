import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Server Supabase client. In Next.js 16 `cookies()` is async and must be
 * awaited, so this factory is async too. The `setAll` try/catch is required:
 * cookie writes throw when called from a Server Component render (only Route
 * Handlers / Server Actions may set cookies); middleware refreshes the session.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* called from a Server Component — safe to ignore */
        }
      },
    },
  });
}
