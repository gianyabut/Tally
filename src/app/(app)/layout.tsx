import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBootstrap } from "@/lib/data/bootstrap";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) redirect("/login");

  const boot = await getBootstrap();
  if (!boot) redirect("/login");
  if (!boot.membership) redirect("/onboarding");

  const name = boot.profile?.name ?? boot.email ?? "You";

  return <AppShell name={name}>{children}</AppShell>;
}
