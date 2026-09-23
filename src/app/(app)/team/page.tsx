import { getTeamData } from "@/lib/data/team";
import { FISCAL_YEAR } from "@/lib/types";
import { TeamView } from "./TeamView";

export default async function TeamPage() {
  const { members, invites } = await getTeamData(FISCAL_YEAR);
  return <TeamView members={members} invites={invites} />;
}
