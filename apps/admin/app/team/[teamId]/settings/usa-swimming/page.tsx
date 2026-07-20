import { getOrganizationTeamType } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import {
  supportsUsaSwimmingIntegration,
  teamTypeLabel,
} from "@project-aqua/swim-core/team-types";
import { eq } from "drizzle-orm";
import { SettingsSection } from "../settings-section";
import { UsaSwimmingSettings } from "./usa-swimming-settings";

export default async function UsaSwimmingPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [org, teamType] = await Promise.all([
    db
      .select()
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1)
      .then((rows) => rows[0]),
    getOrganizationTeamType(teamId),
  ]);

  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};

  if (!supportsUsaSwimmingIntegration(teamType)) {
    return (
      <SettingsSection
        title="USA Swimming"
        description={`Not applicable for ${teamTypeLabel(teamType)} teams`}
      >
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          SWIMS club sync is for USA Swimming member clubs. High school teams
          usually are not USA Swimming members and do not need this integration.
        </p>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="SWIMS integration"
      description="Sync rosters and registration data with USA Swimming."
    >
      <UsaSwimmingSettings
        teamId={teamId}
        connectedClubId={metadata.usaSwimmingClubId}
      />
    </SettingsSection>
  );
}
