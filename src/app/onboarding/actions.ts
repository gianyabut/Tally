"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
import { FISCAL_YEAR } from "@/lib/types";

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

type Credits = { vl: number; sl: number; carry: number };

/**
 * Finish solo onboarding: create the personal workspace (team of one, as
 * admin) + this year's credits atomically, then send any invites from step 3.
 * Lands on the ledger with a `welcome` code the ledger turns into a toast.
 */
export async function completeSoloOnboarding(
  input: Credits & { emails?: string[]; skipped?: boolean },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Derive names server-side from the profile (don't trust the client).
  const { data: profile } = await supabase
    .from("profiles")
    .select("name,email")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.name ?? profile?.email ?? user.email ?? "My";
  const teamName = `${displayName.split(/[\s@]/)[0]}'s workspace`;

  const { error } = await supabase.rpc("complete_solo_onboarding", {
    p_team_name: teamName.slice(0, 80),
    p_year: FISCAL_YEAR,
    p_vl: clamp(input.vl, 0, 30),
    p_sl: clamp(input.sl, 0, 30),
    p_carry: clamp(input.carry, 0, 10),
  });
  if (error) return { ok: false as const, error: error.message };

  const emails = (input.emails ?? [])
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));

  let welcome = input.skipped ? "skip" : "solo";
  if (emails.length > 0) {
    const { data, error: invErr } = await supabase.rpc("create_invites", {
      p_emails: emails,
    });
    if (invErr) {
      welcome = "invites-failed";
    } else {
      const created = (data as { email: string; token: string }[] | null) ?? [];
      await Promise.all(
        created.map((inv) =>
          sendInviteEmail({
            to: inv.email,
            team: teamName,
            from: displayName,
            token: inv.token,
          }),
        ),
      );
      welcome = `invited-${created.length}`;
    }
  }

  redirect(`/ledger?welcome=${welcome}`);
}

/**
 * Finish onboarding on the JOIN path: accept the invite (moves the user's
 * ledger into the team as Staff) and store this year's credits.
 */
export async function completeJoinOnboarding(input: Credits & { token: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: acceptErr } = await supabase.rpc("accept_invite", {
    p_token: input.token,
  });
  if (acceptErr) return { ok: false as const, error: acceptErr.message };

  const { error: ysErr } = await supabase.from("year_settings").upsert(
    {
      user_id: user.id,
      year: FISCAL_YEAR,
      vl_credits: clamp(input.vl, 0, 30),
      sl_credits: clamp(input.sl, 0, 30),
      il_carryover: clamp(input.carry, 0, 10),
    },
    { onConflict: "user_id,year" },
  );
  if (ysErr) return { ok: false as const, error: ysErr.message };

  redirect("/ledger?welcome=joined");
}
