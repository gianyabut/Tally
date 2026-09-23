import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBootstrap } from "@/lib/data/bootstrap";
import { CreditsSetup } from "./CreditsSetup";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const boot = await getBootstrap();
  if (!boot) redirect("/login");
  // Already set up — no re-onboarding.
  if (boot.membership) redirect("/ledger");

  const first = (boot.profile?.name ?? boot.email ?? "there").split(/[\s@]/)[0];

  return <CreditsSetup firstName={first} />;
}
