import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireTeamRole,
} from "@project-aqua/db/authz";
import {
  requiresSafeSportCompliance,
  teamTypeLabel,
} from "@project-aqua/swim-core/team-types";
import type { Metadata } from "next";
import { SettingsSection } from "../settings-section";
import { getSafeSportDashboardAction } from "./actions";
import { SafeSportSettingsClient } from "./safesport-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "SafeSport",
    description: "SafeSport training and MAAPP compliance.",
    alternates: { canonical: `/team/${teamId}/settings/safesport` },
  };
}

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

  const teamType = await getOrganizationTeamType(teamId);

  if (!requiresSafeSportCompliance(teamType)) {
    return (
      <SettingsSection
        title="SafeSport"
        description={`Not required for ${teamTypeLabel(teamType)} teams`}
      >
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          SafeSport training and MAAPP apply to USA Swimming–affiliated
          programs. High school and college teams typically follow school or
          athletic association policies instead. Switch your team type to USA
          Swimming Club in settings if this team should track SafeSport.
        </p>
      </SettingsSection>
    );
  }

  const { summary, credentials } = await getSafeSportDashboardAction(teamId);

  return (
    <SettingsSection
      title="SafeSport & MAAPP"
      description="Coach training, credentials, and reporting for this team."
    >
      <SafeSportSettingsClient
        teamId={teamId}
        summary={summary}
        credentials={credentials}
      />
    </SettingsSection>
  );
}
