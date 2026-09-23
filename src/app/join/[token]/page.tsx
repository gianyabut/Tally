import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { JoinConfirm } from "./JoinConfirm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not signed in → sign in first, then return here.
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
  }

  // Brand-new users join through onboarding (credits first), per APP_FLOW.
  const { data: membership } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    redirect(`/onboarding?invite=${encodeURIComponent(token)}`);
  }

  const { data } = await supabase.rpc("invite_preview", { p_token: token });
  const preview = Array.isArray(data) ? data[0] : data;

  return (
    <JoinConfirm
      token={token}
      teamName={preview?.team_name ?? "the team"}
      inviter={preview?.inviter ?? "A teammate"}
      valid={!!preview?.valid}
    />
  );
}
