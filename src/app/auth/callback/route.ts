import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (PKCE) callback. Google redirects here with `?code=...`; we exchange it
 * for a session (cookies are set by the server client) then continue to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow local redirect paths (single leading slash), never off-site.
  const rawNext = searchParams.get("next") ?? "/";
  const next = /^\/(?!\/)/.test(rawNext) ? rawNext : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
