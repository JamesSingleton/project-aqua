export type TeamLandingPath = "/" | "/onboarding" | `/team/${string}`;

/** Pick where to send a coach after sign-in (no extra team picker when obvious). */
export function pickTeamLandingPath(
  teams: { id: string }[],
  activeOrganizationId?: string | null,
): TeamLandingPath {
  if (teams.length === 0) return "/onboarding";
  if (teams.length === 1) return `/team/${teams[0]!.id}`;
  if (
    activeOrganizationId &&
    teams.some((team) => team.id === activeOrganizationId)
  ) {
    return `/team/${activeOrganizationId}`;
  }
  return "/";
}
