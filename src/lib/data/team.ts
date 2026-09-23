import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type TeamMember = {
  user_id: string;
  name: string | null;
  role: Role;
  is_self: boolean;
  out_today: boolean;
  out_type: string | null;
  vl_left: number;
  sl_left: number;
  il_avail: number;
  il_earned: number; // credited IL days from holiday work
  ot_days: number; // credited OT day count
};

export type Invite = {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  payload: {
    invite_id?: string;
    team_id?: string;
    token?: string;
    team?: string;
    from?: string;
  };
  created_at: string;
};

export async function getTeamData(year: number): Promise<{
  members: TeamMember[];
  invites: Invite[];
}> {
  const supabase = await createClient();
  const [membersRes, invitesRes] = await Promise.all([
    supabase.rpc("team_overview", { p_year: year }),
    supabase
      .from("invites")
      .select("id,email,status,expires_at,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  // Postgres numerics arrive as strings — normalise to numbers.
  const rows = (membersRes.data as Record<string, unknown>[] | null) ?? [];
  const members: TeamMember[] = rows.map((r) => ({
    ...(r as unknown as TeamMember),
    vl_left: Number(r.vl_left),
    sl_left: Number(r.sl_left),
    il_avail: Number(r.il_avail),
    il_earned: Number(r.il_earned ?? 0),
    ot_days: Number(r.ot_days ?? 0),
  }));

  return {
    members,
    invites: (invitesRes.data as Invite[] | null) ?? [],
  };
}

export async function getUnreadNotifications(): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id,type,payload,created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false });

  return (data as NotificationItem[] | null) ?? [];
}

export async function getTeamName(teamId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();
  return (data?.name as string | undefined) ?? "Your team";
}
