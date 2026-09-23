import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (PKCE) callback. Google redirects here with `?code=...`; we exchange it
 * for a session (cookies are set by the server client) then continue to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", origin));
}

/**
 * Resolve `next` to a SAME-ORIGIN path only, defeating open-redirect payloads.
 * Parsing against `origin` normalizes tricks like `//host`, `/\host`, and
 * backslashes; anything that resolves off-origin falls back to "/".
 */
function safeNext(raw: string | null, origin: string): string {
  if (!raw) return "/";
  try {
    const u = new URL(raw, origin);
    if (u.origin === origin) return u.pathname + u.search;
  } catch {
    /* malformed — fall through */
  }
  return "/";
}
