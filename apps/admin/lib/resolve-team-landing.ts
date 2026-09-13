import { getUserTeams } from "@project-aqua/db/authz";
import { pickTeamLandingPath, type TeamLandingPath } from "./team-landing";

export async function resolveTeamLandingPath(
  userId: string,
  activeOrganizationId?: string | null,
): Promise<TeamLandingPath> {
  const teams = await getUserTeams(userId);
  return pickTeamLandingPath(teams, activeOrganizationId);
}
