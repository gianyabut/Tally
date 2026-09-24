import "server-only";
import { getAuth } from "@/lib/auth";
import type { Membership, Profile } from "@/lib/types";

export type Bootstrap = {
  userId: string;
  email: string;
  profile: Profile | null;
  membership: Membership | null;
  teamName: string;
};

/**
 * Signed-in user + the rows that decide routing: their profile and (if any)
 * their team membership, with the team's name joined in. Null when signed out.
 */
export async function getBootstrap(): Promise<Bootstrap | null> {
  const auth = await getAuth();
  if (!auth) return null;
  const { supabase, userId, email } = auth;

  const [{ data: profile }, { data: row }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("memberships").select("*, teams(name)").eq("user_id", userId).maybeSingle(),
  ]);

  let membership: Membership | null = null;
  let teamName = "";
  if (row) {
    const { teams, ...rest } = row as Membership & {
      teams: { name: string } | { name: string }[] | null;
    };
    membership = rest;
    teamName = (Array.isArray(teams) ? teams[0]?.name : teams?.name) ?? "";
  }

  return {
    userId,
    email: email || (profile?.email ?? ""),
    profile: (profile as Profile | null) ?? null,
    membership,
    teamName,
  };
}
