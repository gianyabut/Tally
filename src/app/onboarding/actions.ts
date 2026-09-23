"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FISCAL_YEAR } from "@/lib/types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/**
 * Finish solo onboarding: create the personal workspace (team of one, as admin)
 * and store this year's credits — atomically, via a SECURITY DEFINER RPC.
 */
export async function completeSoloOnboarding(input: {
  vl: number;
  sl: number;
  carry: number;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Derive the workspace name server-side from the profile (don't trust client).
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  const first = (profile?.name ?? user.email ?? "My").split(/[\s@]/)[0];
  const teamName = `${first}'s workspace`;

  const { error } = await supabase.rpc("complete_solo_onboarding", {
    p_team_name: teamName.slice(0, 80),
    p_year: FISCAL_YEAR,
    p_vl: clamp(input.vl, 0, 30),
    p_sl: clamp(input.sl, 0, 30),
    p_carry: clamp(input.carry, 0, 10),
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  redirect("/ledger");
}
