import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Membership, Profile } from "@/lib/types";

export type Bootstrap = {
  userId: string;
  email: string;
  profile: Profile | null;
  membership: Membership | null;
};

/**
 * Authenticated user + the two rows that decide routing: their profile and
 * (if any) their team membership. Returns null when not signed in.
 *
 * `getUser()` revalidates the token with the Auth server, so it's safe to gate
 * on for routing decisions.
 */
export async function getBootstrap(): Promise<Bootstrap | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("memberships")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: (profile as Profile | null) ?? null,
    membership: (membership as Membership | null) ?? null,
  };
}
