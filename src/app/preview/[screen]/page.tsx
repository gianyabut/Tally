import { notFound } from "next/navigation";
import { AppRuntime } from "@/app/(app)/runtime";
import { AppShell } from "@/app/(app)/AppShell";
import { LedgerView } from "@/app/(app)/ledger/LedgerView";
import { TeamView } from "@/app/(app)/team/TeamView";
import { ExportView } from "@/app/(app)/export/ExportView";
import { Onboarding } from "@/app/onboarding/Onboarding";
import { appData, members, pendingInvite, report } from "../fixtures";

/**
 * Design-QA harness (dev only): renders the real screens with the prototype's
 * seed data so they can be pixel-diffed against docs/ (scripts/visual/).
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ screen: string }>;
  searchParams: Promise<{ solo?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen } = await params;
  const { solo } = await searchParams;

  if (screen === "onboarding") {
    return (
      <Onboarding
        firstName="Ara"
        email="ara@gmail.com"
        invite={solo ? null : pendingInvite}
      />
    );
  }

  const body =
    screen === "ledger" ? (
      <LedgerView />
    ) : screen === "team" ? (
      <TeamView members={members} invites={[]} />
    ) : screen === "export" ? (
      <ExportView data={report} canTeam teamCount={members.length} />
    ) : null;
  if (!body) notFound();

  return (
    <AppRuntime
      data={{
        ...appData,
        // Stamp fixture notifications "now" per request (they read "JUST NOW").
        notifications: appData.notifications.map((n) => ({ ...n, created_at: new Date().toISOString() })),
      }}
    >
      <AppShell name="Ara Reyes" active={`/${screen}`}>
        {body}
      </AppShell>
    </AppRuntime>
  );
}
