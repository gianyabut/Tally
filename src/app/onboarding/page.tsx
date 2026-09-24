import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getBootstrap } from "@/lib/data/bootstrap";
import { Onboarding, type PendingInvite } from "./Onboarding";

type InviteRow = {
  token: string;
  team_name: string;
  inviter: string;
  member_count: number | string;
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  if (!isSupabaseConfigured) redirect("/login");

  const boot = await getBootstrap();
  if (!boot) redirect("/login");
  // Already set up — no re-onboarding.
  if (boot.membership) redirect("/ledger");

  // A pending invite (from a /join link's token, else matched by email) fills
  // step 1's "Join" option; without one that option shows how to get invited.
  const { invite: token } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc(
    "my_pending_invite",
    token ? { p_token: token } : {},
  );
  const row = (Array.isArray(data) ? data[0] : data) as InviteRow | null;
  const invite: PendingInvite | null = row
    ? {
        token: row.token,
        teamName: row.team_name,
        inviter: row.inviter,
        memberCount: Number(row.member_count),
      }
    : null;

  const first = (boot.profile?.name ?? boot.email ?? "there").split(/[\s@]/)[0];

  return <Onboarding firstName={first} email={boot.email} invite={invite} />;
}
