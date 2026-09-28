import { getOrganizationTeamType } from "@lane4hq/db/authz";
import { db } from "@lane4hq/db/client";
import { organization } from "@lane4hq/db/schema";
import {
  supportsUsaSwimmingIntegration,
  teamTypeLabel,
} from "@lane4hq/swim-core/team-types";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { NotPermittedPanel } from "@/components/not-permitted-panel";
import { getTeamCapabilitiesForCurrentMember } from "@/lib/team-member-capabilities";
import { SettingsSection } from "../settings-section";
import { UsaSwimmingSettings } from "./usa-swimming-settings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "USA Swimming",
    description: "USA Swimming / SWIMS integration settings.",
    alternates: { canonical: `/team/${teamId}/settings/usa-swimming` },
  };
}

export default async function UsaSwimmingPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { canManageTeam } = await getTeamCapabilitiesForCurrentMember(teamId);
  if (!canManageTeam) {
    return (
      <NotPermittedPanel
        title="USA Swimming settings are restricted"
        description="Only team owners and head coaches can manage USA Swimming integration."
      />
    );
  }

  const [org, teamType] = await Promise.all([
    db
      .select()
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1)
      .then((rows) => rows[0]),
    getOrganizationTeamType(teamId),
  ]);

  if (!supportsUsaSwimmingIntegration(teamType)) {
    return (
      <SettingsSection
        title="USA Swimming"
        description={`Not applicable for ${teamTypeLabel(teamType)} teams`}
      >
        <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
          SWIMS club sync is for USA Swimming member clubs. High school teams
          usually are not USA Swimming members and do not need this integration.
          Summer league teams skip SWIMS and SafeSport as well.
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
        connectedClubId={org?.usaSwimmingClubId ?? undefined}
      />
    </SettingsSection>
  );
}
