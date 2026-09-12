import { isCoachingRole } from "@project-aqua/auth/roles";
import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamMember } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { getTeamMembers } from "@project-aqua/db/queries/members";
import { getTeamUiPreferences } from "@project-aqua/db/queries/preferences";
import {
  getRoster,
  getRosterFacetCounts,
  getRosterPage,
  type RosterRowResult,
} from "@project-aqua/db/queries/roster";
import {
  ensureCurrentSeason,
  listTeamSeasons,
} from "@project-aqua/db/queries/seasons";
import { organization, type TeamUiState } from "@project-aqua/db/schema";
import {
  CLASS_YEAR_LABELS,
  CLASS_YEARS,
  type ClassYear,
  parseTeamType,
  supportsClassYear,
  supportsCollegeEligibility,
  supportsUsaSwimmingIntegration,
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
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { NewSeasonRosterWizard } from "@/components/roster/new-season-roster-wizard";
import { RosterTable } from "@/components/roster/roster-table";
import { SeasonSelector } from "@/components/roster/season-selector";
import type { Swimmer } from "@/types";
import type { Option } from "@/types/data-table";
import { listGroupsAction } from "./groups-actions";
import { GroupsPanel } from "./groups-panel";
import { RosterCoachesPanel } from "./roster-coaches-panel";
import { rosterSearchParamsCache } from "./search-params";

function mapRosterRowToSwimmer(row: RosterRowResult): Swimmer {
  const firstName = row.firstName ?? "";
  const lastName = row.lastName ?? "";
  const displayFirst = row.preferredName || firstName;
  return {
    id: row.swimmerId,
    membershipId: row.membershipId,
    enrollmentId: row.enrollmentId,
    seasonId: row.seasonId,
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
    groupId: row.groupId,
    classYear: row.classYear,
    academicStanding: row.academicStanding,
    eligibilityStatus: row.eligibilityStatus,
    seasonsOfCompetitionUsed: row.seasonsOfCompetitionUsed,
    eligibilityNotes: row.eligibilityNotes,
    usaId: row.governingBodyId,
    status: row.status ?? "active",
    personalRecords: [],
    parents: [],
    emergencyContacts: [],
  };
}

function buildFacetOptions(
  facets: Awaited<ReturnType<typeof getRosterFacetCounts>>,
  groups: { id: string; name: string }[],
  showClassYear: boolean,
): {
  status: Option[];
  gender: Option[];
  groupId: Option[];
  classYear: Option[];
} {
  const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

  return {
    status: [
      {
        label: "Active",
        value: "active",
        count: facets.status.active ?? 0,
      },
      {
        label: "Inactive",
        value: "inactive",
        count: facets.status.inactive ?? 0,
      },
    ],
    gender: [
      {
        label: "Male",
        value: "male",
        count: facets.gender.male ?? 0,
      },
      {
        label: "Female",
        value: "female",
        count: facets.gender.female ?? 0,
      },
    ],
    groupId: [
      {
        label: "Unassigned",
        value: "none",
        count: facets.groupId.none ?? 0,
      },
      ...groups.map((group) => ({
        label: group.name,
        value: group.id,
        count: facets.groupId[group.id] ?? 0,
      })),
      ...Object.entries(facets.groupId)
        .filter(
          ([id]) =>
            id !== "none" &&
            !groupNameById.has(id) &&
            (facets.groupId[id] ?? 0) > 0,
        )
        .map(([id, count]) => ({
          label: id,
          value: id,
          count,
        })),
    ],
    classYear: showClassYear
      ? CLASS_YEARS.map((year) => ({
          label: CLASS_YEAR_LABELS[year as ClassYear],
          value: year,
          count: facets.classYear[year] ?? 0,
        }))
      : [],
  };
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

async function RosterSwimmersTable({
  teamId,
  seasonId,
  searchParams,
  showClassYear,
  showCollegeEligibility,
  showUsaSwimmingId,
  groups,
  facetOptions,
  initialColumnVisibility,
  prefsSorting,
}: {
  teamId: string;
  seasonId: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  showClassYear: boolean;
  showCollegeEligibility: boolean;
  showUsaSwimmingId: boolean;
  groups: { id: string; name: string }[];
  facetOptions: ReturnType<typeof buildFacetOptions>;
  initialColumnVisibility: VisibilityState;
  prefsSorting: SortingState;
}) {
  const raw = await searchParams;
  const parsed = rosterSearchParamsCache.parse(raw);
  const hasSortParam =
    raw.sort != null &&
    String(Array.isArray(raw.sort) ? raw.sort[0] : raw.sort).length > 0;
  const sort = hasSortParam
    ? parsed.sort
    : prefsSorting.length > 0
      ? prefsSorting
      : parsed.sort;

  const pageResult = await getRosterPage(teamId, {
    seasonId,
    q: parsed.firstName || undefined,
    status: parsed.status.length > 0 ? parsed.status : undefined,
    gender: parsed.gender.length > 0 ? parsed.gender : undefined,
    groupId: parsed.groupId.length > 0 ? parsed.groupId : undefined,
    classYear: parsed.classYear.length > 0 ? parsed.classYear : undefined,
    sort,
    page: parsed.page,
    perPage: parsed.perPage,
  });

  const swimmers = pageResult.data.map(mapRosterRowToSwimmer);

  return (
    <RosterTable
      teamId={teamId}
      seasonId={seasonId}
      data={swimmers}
      pageCount={pageResult.pageCount}
      groups={groups}
      facetOptions={facetOptions}
      showClassYear={showClassYear}
      showCollegeEligibility={showCollegeEligibility}
      showUsaSwimmingId={showUsaSwimmingId}
      initialColumnVisibility={initialColumnVisibility}
      initialSorting={sort}
    />
  );
}

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const rawParams = await searchParams;
  const parsedParams = rosterSearchParamsCache.parse(rawParams);
  const tabParam =
    typeof rawParams.tab === "string" ? rawParams.tab : undefined;
  const defaultTab =
    tabParam === "coaches"
      ? "coaches"
      : tabParam === "groups"
        ? "groups"
        : "swimmers";

  const currentSeasonPromise = ensureCurrentSeason(teamId);
  const seasonsPromise = currentSeasonPromise.then(() =>
    listTeamSeasons(teamId),
  );

  const [orgRows, members, membership, teamUi, groups, currentSeason, seasons] =
    await Promise.all([
      db
        .select()
        .from(organization)
        .where(eq(organization.id, teamId))
        .limit(1),
      getTeamMembers(teamId),
      session?.user?.id
        ? getMember(session.user.id, teamId)
        : Promise.resolve(null),
      session?.user?.id
        ? getTeamUiPreferences(session.user.id, teamId)
        : Promise.resolve<TeamUiState>({}),
      listGroupsAction(teamId),
      currentSeasonPromise,
      seasonsPromise,
    ]);

  const selectedSeason =
    (parsedParams.season
      ? seasons.find((s) => s.id === parsedParams.season)
      : null) ??
    seasons.find((s) => s.isCurrent) ??
    currentSeason;

  const [facets, fullRoster] = await Promise.all([
    getRosterFacetCounts(teamId, selectedSeason.id),
    defaultTab === "groups"
      ? getRoster(teamId, selectedSeason.id)
      : Promise.resolve([]),
  ]);

  const org = orgRows[0];
  const teamType = parseTeamType(org?.teamType);
  const showClassYear = supportsClassYear(teamType);
  const showCollegeEligibility = supportsCollegeEligibility(teamType);
  const showUsaSwimmingId = supportsUsaSwimmingIntegration(teamType);
  const coaches = members.filter((m) => isCoachingRole(m.role));
  const canManage =
    membership?.role === "owner" ||
    membership?.role === "head_coach" ||
    membership?.role === "admin";

  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));
  const facetOptions = buildFacetOptions(facets, groupOptions, showClassYear);
  const rosterColumnVisibility =
    (teamUi.roster?.columnVisibility as VisibilityState | undefined) ?? {};
  const rosterSorting =
    (teamUi.roster?.sorting as SortingState | undefined) ?? [];

  const seasonOptions = seasons.map((s) => ({
    id: s.id,
    label: s.label,
    isCurrent: s.isCurrent,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Roster"
        description={`Manage swimmers, groups, and coaches · ${teamTypeLabel(teamType)}`}
        actions={
          defaultTab === "swimmers" ? (
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <NewSeasonRosterWizard
                  teamId={teamId}
                  sourceSeasonId={selectedSeason.id}
                  showClassYear={showClassYear}
                  showCollegeEligibility={showCollegeEligibility}
                />
              ) : null}
              <Link
                href={`/team/${teamId}/swimmers/create`}
                className={buttonVariants()}
              >
                <UserPlusIcon data-icon="inline-start" />
                Add swimmer
              </Link>
            </div>
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
            Swimmers ({facets.totalActive})
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
                  {facets.totalActive}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Male</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-timing text-3xl font-semibold">
                  {facets.maleActive}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Female</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-timing text-3xl font-semibold">
                  {facets.femaleActive}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
              <div className="flex flex-col gap-1.5">
                <CardTitle>Swimmers</CardTitle>
                <CardDescription>
                  {facets.totalActive} active swimmers on roster
                  {selectedSeason.label ? ` · ${selectedSeason.label}` : null}
                </CardDescription>
              </div>
              <SeasonSelector
                teamId={teamId}
                seasons={seasonOptions}
                selectedSeasonId={selectedSeason.id}
              />
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <DataTableSkeleton
                    columnCount={
                      (showClassYear ? 1 : 0) + (showUsaSwimmingId ? 1 : 0) + 8
                    }
                    filterCount={showClassYear ? 4 : 3}
                  />
                }
              >
                <RosterSwimmersTable
                  teamId={teamId}
                  seasonId={selectedSeason.id}
                  searchParams={searchParams}
                  showClassYear={showClassYear}
                  showCollegeEligibility={showCollegeEligibility}
                  showUsaSwimmingId={showUsaSwimmingId}
                  groups={groupOptions}
                  facetOptions={facetOptions}
                  initialColumnVisibility={rosterColumnVisibility}
                  prefsSorting={rosterSorting}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <GroupsPanel
            teamId={teamId}
            groups={groupOptions}
            members={fullRoster.map((r) => ({
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
