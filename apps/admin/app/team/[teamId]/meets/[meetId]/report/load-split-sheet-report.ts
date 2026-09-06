import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import {
  buildSplitSheetReport,
  type SplitSheetReport,
} from "@project-aqua/reports";
import { loadMeetLineupSnapshot } from "../../load-meet-lineup-snapshot";

export async function loadSplitSheetReport(
  teamId: string,
  meetId: string,
  options: {
    includeRelayAlternates?: boolean;
    groupBy?: "event" | "swimmer";
  } = {},
): Promise<SplitSheetReport | null> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  const loaded = await loadMeetLineupSnapshot(teamId, meetId);
  if (!loaded) return null;

  return buildSplitSheetReport(loaded.snapshot, {
    coachName: session?.user?.name ?? null,
    coachEmail: session?.user?.email ?? null,
    includeRelayAlternates: options.includeRelayAlternates === true,
    groupBy: options.groupBy === "swimmer" ? "swimmer" : "event",
  });
}
