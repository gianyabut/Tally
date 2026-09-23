"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";
import type { Role } from "@/lib/types";

type Result = { ok: true } | { ok: false; error: string };

async function client() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");
  return { supabase, user };
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function senderContext(supabase: SupabaseServer, userId: string) {
  const [{ data: profile }, { data: mem }] = await Promise.all([
    supabase.from("profiles").select("name,email").eq("id", userId).maybeSingle(),
    supabase
      .from("memberships")
      .select("teams(name)")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const team =
    (mem?.teams as { name: string } | { name: string }[] | null) ?? null;
  const teamName = Array.isArray(team)
    ? (team[0]?.name ?? "your team")
    : (team?.name ?? "your team");
  return {
    from: profile?.name ?? profile?.email ?? "A teammate",
    teamName,
  };
}

/** Create invites, then best-effort email each recipient. */
export async function sendInvites(
  emails: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const { supabase } = await client();
  const cleaned = emails
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
  if (cleaned.length === 0) return { ok: false, error: "Add at least one email" };

  const { data, error } = await supabase.rpc("create_invites", {
    p_emails: cleaned,
  });
  if (error) return { ok: false, error: error.message };

  const created = (data as { email: string; token: string }[] | null) ?? [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { from, teamName } = await senderContext(supabase, user!.id);

  await Promise.all(
    created.map((inv) =>
      sendInviteEmail({
        to: inv.email,
        team: teamName,
        from,
        token: inv.token,
      }),
    ),
  );

  revalidatePath("/team");
  return { ok: true, count: created.length };
}

export async function setMemberRole(
  target: string,
  role: Role,
): Promise<Result> {
  const { supabase } = await client();
  const { error } = await supabase.rpc("set_member_role", {
    p_target: target,
    p_role: role,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInvite(id: string): Promise<Result> {
  const { supabase } = await client();
  const { error } = await supabase.rpc("revoke_invite", { p_id: id });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function resendInvite(id: string): Promise<Result> {
  const { supabase } = await client();
  const { data, error } = await supabase.rpc("resend_invite", { p_id: id });
  if (error) return { ok: false, error: error.message };
  const inv = data as { email: string; token: string } | null;
  if (inv) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { from, teamName } = await senderContext(supabase, user!.id);
    await sendInviteEmail({
      to: inv.email,
      team: teamName,
      from,
      token: inv.token,
    });
  }
  revalidatePath("/team");
  return { ok: true };
}

export async function acceptInvite(token: string): Promise<Result> {
  const { supabase } = await client();
  const { error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Decline / dismiss a notification (mark read). */
export async function markNotificationRead(id: string): Promise<Result> {
  const { supabase } = await client();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
