import { getSession } from "@lane4hq/auth/session";
import {
  getMember,
  getTeamCapabilities,
  type TeamCapabilities,
} from "@lane4hq/db/authz";

export async function getTeamCapabilitiesForCurrentMember(
  teamId: string,
): Promise<TeamCapabilities> {
  const session = await getSession();
  if (!session?.user?.id) {
    return getTeamCapabilities(null);
  }
  const member = await getMember(session.user.id, teamId);
  return getTeamCapabilities(member?.role);
}
