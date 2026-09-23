import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBootstrap } from "@/lib/data/bootstrap";
import { getLedgerData } from "@/lib/data/ledger";
import { getUnreadNotifications, getTeamName } from "@/lib/data/team";
import { deriveBalances } from "@/lib/ledger/balances";
import { FISCAL_YEAR } from "@/lib/types";
import { AppRuntime, type AppData } from "./runtime";
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
  const [ledger, notifications, teamName] = await Promise.all([
    getLedgerData(FISCAL_YEAR),
    getUnreadNotifications(),
    getTeamName(boot.membership.team_id),
  ]);
  const ys = ledger.yearSettings ?? {
    vl_credits: 0,
    sl_credits: 0,
    il_carryover: 0,
  };
  const balances = deriveBalances(ledger.entries, ys);

  const data: AppData = {
    year: FISCAL_YEAR,
    yearSettings: ledger.yearSettings,
    entries: ledger.entries,
    holidays: ledger.holidays,
    balances,
    nextHoliday: ledger.nextHoliday,
    role: boot.membership.role,
    teamName,
    notifications,
  };

  return (
    <AppRuntime data={data}>
      <AppShell name={name}>{children}</AppShell>
    </AppRuntime>
  );
}
