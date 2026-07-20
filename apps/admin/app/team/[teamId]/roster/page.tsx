import { isCoachingRole } from "@project-aqua/auth/roles";
import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamMember } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { getTeamMembers } from "@project-aqua/db/queries/members";
import { getTeamUiPreferences } from "@project-aqua/db/queries/preferences";
import { getRoster } from "@project-aqua/db/queries/roster";
import { organization, type TeamUiState } from "@project-aqua/db/schema";
import {
  parseTeamType,
  supportsClassYear,
  teamTypeLabel,
} from "@project-aqua/swim-core/team-types";
import { buttonVariants } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@project-aqua/ui/components/tabs";
import type { SortingState, VisibilityState } from "@tanstack/react-table";
import { eq } from "drizzle-orm";
import { UserPlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RosterTable } from "@/components/roster/roster-table";
import type { Swimmer } from "@/types";
import { listGroupsAction } from "./groups-actions";
import { GroupsPanel } from "./groups-panel";
import { RosterCoachesPanel } from "./roster-coaches-panel";

function mapRosterToSwimmers(
  roster: Awaited<ReturnType<typeof getRoster>>,
): Swimmer[] {
  return roster.map((row) => {
    const firstName = row.firstName ?? "";
    const lastName = row.lastName ?? "";
    const displayFirst = row.preferredName || firstName;
    return {
      id: row.swimmerId,
      firstName,
      lastName,
      preferredName: row.preferredName,
      name: `${displayFirst} ${lastName}`.trim(),
      gender: row.gender === "male" ? "Male" : "Female",
      age: row.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(row.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : 0,
      dateOfBirth: row.dateOfBirth ?? "",
      trainingGroup: row.groupName ?? row.practiceGroup ?? "",
      trainingGroups: row.trainingGroups ?? [],
      practiceGroup: row.practiceGroup ?? "",
      classYear: row.classYear,
      usaId: row.governingBodyId,
      status: row.status ?? "active",
      personalRecords: [],
      parents: [],
      emergencyContacts: [],
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Roster",
    alternates: { canonical: `/team/${teamId}/roster` },
  };
}

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { teamId } = await params;
  const { tab } = await searchParams;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const defaultTab =
    tab === "coaches" ? "coaches" : tab === "groups" ? "groups" : "swimmers";

  const [roster, orgRows, members, membership, teamUi] = await Promise.all([
    getRoster(teamId),
    db.select().from(organization).where(eq(organization.id, teamId)).limit(1),
    getTeamMembers(teamId),
    session?.user?.id
      ? getMember(session.user.id, teamId)
      : Promise.resolve(null),
    session?.user?.id
      ? getTeamUiPreferences(session.user.id, teamId)
      : Promise.resolve<TeamUiState>({}),
  ]);

  const swimmers = mapRosterToSwimmers(roster);
  const org = orgRows[0];
  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};
  const teamType = parseTeamType(metadata.teamType);
  const maleSwimmers = swimmers.filter((s) => s.gender === "Male").length;
  const femaleSwimmers = swimmers.filter((s) => s.gender === "Female").length;
  const coaches = members.filter((m) => isCoachingRole(m.role));
  const canManage =
    membership?.role === "owner" ||
    membership?.role === "head_coach" ||
    membership?.role === "admin";

  const groups = defaultTab === "groups" ? await listGroupsAction(teamId) : [];
  const rosterColumnVisibility =
    (teamUi.roster?.columnVisibility as VisibilityState | undefined) ?? {};
  const rosterSorting =
    (teamUi.roster?.sorting as SortingState | undefined) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roster"
        description={`Manage swimmers, groups, and coaches · ${teamTypeLabel(teamType)}`}
        actions={
          defaultTab === "swimmers" ? (
            <Link
              href={`/team/${teamId}/swimmers/create`}
              className={buttonVariants()}
            >
              <UserPlusIcon data-icon="inline-start" />
              Add swimmer
            </Link>
          ) : null
        }
      />

      <Tabs key={defaultTab} defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger
            value="swimmers"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/roster`} />}
          >
            Swimmers ({swimmers.length})
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/roster?tab=groups`} />}
          >
            Groups
          </TabsTrigger>
          <TabsTrigger
            value="coaches"
            nativeButton={false}
            render={<Link href={`/team/${teamId}/roster?tab=coaches`} />}
          >
            Coaches ({coaches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swimmers" className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-timing text-3xl font-semibold">
                  {swimmers.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Male</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-timing text-3xl font-semibold">
                  {maleSwimmers}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Female</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-timing text-3xl font-semibold">
                  {femaleSwimmers}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Swimmers</CardTitle>
              <CardDescription>
                {swimmers.length} active swimmers on roster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RosterTable
                teamId={teamId}
                data={swimmers}
                showClassYear={supportsClassYear(teamType)}
                initialColumnVisibility={rosterColumnVisibility}
                initialSorting={rosterSorting}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <GroupsPanel
            teamId={teamId}
            groups={groups.map((g) => ({ id: g.id, name: g.name }))}
            members={roster.map((r) => ({
              membershipId: r.membershipId,
              name: r.preferredName
                ? `${r.preferredName} (${r.firstName} ${r.lastName})`
                : `${r.firstName} ${r.lastName}`,
              groupId: r.groupId ?? null,
            }))}
          />
        </TabsContent>

        <TabsContent value="coaches">
          <RosterCoachesPanel
            teamId={teamId}
            coaches={coaches}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
