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
import { PracticeDefaultsForm } from "./practice-defaults-form";
import { SettingsSection } from "./settings-section";
import { TeamDangerZone } from "./team-danger-zone";
import { TeamLogoUploader } from "./team-logo-uploader";
import { TeamProfileForm } from "./team-profile-form";
import { TeamTypeForm } from "./team-type-form";

function parseDefaultPracticeLocation(metadata: string | null | undefined) {
  if (!metadata) return "";
  try {
    const parsed = JSON.parse(metadata) as {
      defaultPracticeLocation?: unknown;
    };
    return typeof parsed.defaultPracticeLocation === "string"
      ? parsed.defaultPracticeLocation
      : "";
  } catch {
    return "";
  }
}

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
        description="Name and logo shown across the admin app. Team names do not need to be unique."
      >
        <div className="flex flex-col gap-8">
          <TeamProfileForm teamId={teamId} name={org?.name ?? ""} />
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
          defaultLocation={parseDefaultPracticeLocation(org?.metadata)}
        />
      </SettingsSection>

      <SettingsSection
        title="Team type"
        description="Controls SafeSport, USA Swimming, and roster defaults."
        showSeparator
      >
        <TeamTypeForm teamId={teamId} teamType={teamType} />
      </SettingsSection>

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
