import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { getSafeSportDashboardAction } from "./actions";
import { SafeSportSettingsClient } from "./safesport-settings";

export default async function SafeSportSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
  ]);

  const { summary, credentials } = await getSafeSportDashboardAction(teamId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SafeSport</h1>
        <p className="text-muted-foreground">
          MAAPP compliance, coach training, and reporting
        </p>
      </div>
      <SafeSportSettingsClient
        teamId={teamId}
        summary={summary}
        credentials={credentials}
      />
    </div>
  );
}
