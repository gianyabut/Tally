import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBootstrap } from "@/lib/data/bootstrap";
import { getLedgerData } from "@/lib/data/ledger";
import { getUnreadNotifications } from "@/lib/data/team";
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

  // One parallel batch; all three share the request's single auth check.
  const [boot, ledger, notifications] = await Promise.all([
    getBootstrap(),
    getLedgerData(FISCAL_YEAR),
    getUnreadNotifications(),
  ]);
  if (!boot) redirect("/login");
  if (!boot.membership) redirect("/onboarding");

  const name = boot.profile?.name ?? boot.email ?? "You";
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
    teamName: boot.teamName,
    notifications,
  };

  return (
    <AppRuntime data={data}>
      <AppShell name={name}>{children}</AppShell>
    </AppRuntime>
  );
}
