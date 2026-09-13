import { getSession } from "@project-aqua/auth/session";
import { getMember, getOrganizationTeamType } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { getTeamMembers } from "@project-aqua/db/queries/members";
import { organization } from "@project-aqua/db/schema";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@project-aqua/ui/components/alert";
import { eq } from "drizzle-orm";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { AssociationCapsForm } from "./association-caps-form";
import { PracticeDefaultsForm } from "./practice-defaults-form";
import { SettingsSection } from "./settings-section";
import { TeamDangerZone } from "./team-danger-zone";
import { TeamLogoUploader } from "./team-logo-uploader";
import { TeamProfileForm } from "./team-profile-form";
import { TeamTypeForm } from "./team-type-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Team",
    description: "Manage team profile, type, and danger zone.",
    alternates: { canonical: `/team/${teamId}/settings` },
  };
}

export default async function TeamSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ logoError?: string }>;
}) {
  const { teamId } = await params;
  const { logoError } = await searchParams;
  const session = await getSession();

  const [org, teamType, members, membership] = await Promise.all([
    db
      .select()
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1)
      .then((rows) => rows[0]),
    getOrganizationTeamType(teamId),
    getTeamMembers(teamId),
    session?.user?.id
      ? getMember(session.user.id, teamId)
      : Promise.resolve(null),
  ]);

  const isOwner = membership?.role === "owner";
  const currentOwner = members.find((m) => m.userId === session?.user?.id);
  const transferCandidates = members.filter(
    (m) => m.userId !== session?.user?.id && m.role !== "owner",
  );

  return (
    <div className="flex flex-col">
      {logoError ? (
        <Alert className="mb-6">
          <AlertCircle />
          <AlertTitle>Team created without a logo</AlertTitle>
          <AlertDescription>
            Your team is ready. Upload a logo below when you have a moment.
          </AlertDescription>
        </Alert>
      ) : null}

      <SettingsSection
        title="Team profile"
        description="Name, Hy-Tek abbreviation, LSC, and mailing address used on Meet Manager entry packs. C3 email is the head coach’s account email."
      >
        <div className="flex flex-col gap-8">
          <TeamProfileForm
            teamId={teamId}
            name={org?.name ?? ""}
            teamCode={org?.teamCode ?? ""}
            lscCode={org?.lscCode ?? ""}
            addressLine1={org?.addressLine1 ?? ""}
            addressLine2={org?.addressLine2 ?? ""}
            city={org?.city ?? ""}
            region={org?.region ?? ""}
            postalCode={org?.postalCode ?? ""}
            country={org?.country ?? ""}
          />
          <TeamLogoUploader teamId={teamId} logoUrl={org?.logo ?? null} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Practice defaults"
        description="Used when creating practice sessions and calendar events."
        showSeparator
      >
        <PracticeDefaultsForm
          teamId={teamId}
          defaultLocation={org?.defaultPracticeLocation ?? ""}
        />
      </SettingsSection>

      <SettingsSection
        title="Team type"
        description="Controls SafeSport, USA Swimming, and roster defaults."
        showSeparator
      >
        <TeamTypeForm teamId={teamId} teamType={teamType} />
      </SettingsSection>

      {teamType === "high_school" ? (
        <SettingsSection
          title="Association event caps"
          description="Max scoring names per individual event and relay teams per event for your high-school association. Not the per-athlete limits on a meet file."
          showSeparator
        >
          <AssociationCapsForm
            teamId={teamId}
            maxScoringEntriesPerIndividualEvent={
              org?.maxScoringEntriesPerIndividualEvent ?? null
            }
            maxRelayTeamsPerEvent={org?.maxRelayTeamsPerEvent ?? null}
          />
        </SettingsSection>
      ) : null}

      {isOwner && currentOwner ? (
        <SettingsSection
          title="Danger zone"
          description="Irreversible or ownership-changing actions for this team."
          showSeparator
        >
          <TeamDangerZone
            teamId={teamId}
            currentOwner={currentOwner}
            candidates={transferCandidates}
          />
        </SettingsSection>
      ) : null}
    </div>
  );
}
