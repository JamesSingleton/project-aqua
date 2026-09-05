import { getSession } from "@project-aqua/auth/session";
import {
  getMember,
  getOrganizationTeamType,
  getUserTeams,
  hasCurrentSafeSportTraining,
} from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import {
  getAnalyticsSummary,
  getAttendanceSeries,
  getVolumeSeries,
} from "@project-aqua/db/queries/analytics";
import { getTeamCalendarProjection } from "@project-aqua/db/queries/calendar";
import {
  getMeetEntryProgressCounts,
  getMeets,
  getUpcomingMeetsForOrganizations,
} from "@project-aqua/db/queries/meets";
import { getTeamBestTimesInRange } from "@project-aqua/db/queries/progression";
import {
  getRosterStats,
  getSwimsDashboardSummary,
} from "@project-aqua/db/queries/roster";
import { getComplianceSummary } from "@project-aqua/db/queries/safesport";
import { getCurrentSeason } from "@project-aqua/db/queries/seasons";
import { getRecentWorkouts } from "@project-aqua/db/queries/workouts";
import { organization } from "@project-aqua/db/schema";
import {
  formatDateOnly,
  formatDateOnlyLabel,
  parseDateOnly,
  seasonTrainingPhase,
} from "@project-aqua/swim-core/calendar-date";
import {
  formatBestTimeEventLabel,
  requiresSafeSportCompliance,
  supportsUsaSwimmingIntegration,
} from "@project-aqua/swim-core/team-types";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { eq } from "drizzle-orm";
import {
  CalendarDaysIcon,
  ClipboardCheckIcon,
  DumbbellIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AttendanceChart, VolumeChart } from "@/components/analytics-charts";
import { DashboardListRow } from "@/components/dashboard/dashboard-list-row";
import { MeetEntryDeadlinesCard } from "@/components/dashboard/meet-entry-deadlines-card";
import { NextCompetitionCard } from "@/components/dashboard/next-competition-card";
import { RecentBestTimesCard } from "@/components/dashboard/recent-best-times-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SwimsConnectionWidget } from "@/components/dashboard/swims-connection-widget";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Dashboard",
    alternates: { canonical: `/team/${teamId}` },
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localDateOnly(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatEventWhen(startsAt: Date, source: string): string {
  if (source === "meet") return formatDateOnlyLabel(startsAt);
  return startsAt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function seriesDelta(values: number[]): number | null {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const earlier = values.slice(0, mid);
  const later = values.slice(mid);
  const avg = (xs: number[]) =>
    xs.reduce((sum, n) => sum + n, 0) / Math.max(xs.length, 1);
  return Math.round((avg(later) - avg(earlier)) * 10) / 10;
}

function formatDistance(value: number): string {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`;
  return value.toLocaleString();
}

function daysUntilDate(dateOnly: string, todayKey: string): number | null {
  const start = new Date(`${dateOnly}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(today.getTime())) {
    return null;
  }
  return Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
}

function dashboardDescription(
  weekLabel: string,
  season: {
    label: string;
    startsOn: string;
    endsOn: string;
  } | null,
  todayKey: string,
): string {
  if (!season) return weekLabel;

  const phase = seasonTrainingPhase(todayKey, season.startsOn, season.endsOn);
  if (!phase) return weekLabel;

  if (phase.status === "before") {
    const start = parseDateOnly(season.startsOn);
    const startsLabel = start
      ? formatDateOnlyLabel(start, undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : season.startsOn;
    return `${weekLabel} — Season starts ${startsLabel}`;
  }

  if (phase.status === "after") {
    const end = parseDateOnly(season.endsOn);
    const endsLabel = end
      ? formatDateOnlyLabel(end, undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : season.endsOn;
    return `${weekLabel} — ${season.label} ended ${endsLabel}`;
  }

  return `${weekLabel} — Week ${phase.week} of ${season.label}`;
}

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();

  const now = new Date();
  const calendarFrom = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const calendarTo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 14,
    23,
    59,
    59,
  );
  const todayKey = localDateOnly(now);
  const weekLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const seasonPromise = getCurrentSeason(teamId);
  const seasonBestTimesPromise = seasonPromise.then((current) =>
    current
      ? getTeamBestTimesInRange(teamId, {
          startsOn: current.startsOn,
          endsOn: current.endsOn,
        })
      : Promise.resolve([]),
  );

  const [
    rosterStats,
    summary,
    attendanceSeries,
    volumeSeriesResult,
    meets,
    calendarEvents,
    recentWorkouts,
    season,
    seasonBestTimes,
    teamType,
    org,
    otherTeamMeets,
  ] = await Promise.all([
    getRosterStats(teamId),
    getAnalyticsSummary(teamId),
    getAttendanceSeries(teamId, 30),
    getVolumeSeries(teamId, 30),
    getMeets(teamId),
    getTeamCalendarProjection(teamId, {
      from: calendarFrom,
      to: calendarTo,
    }),
    getRecentWorkouts(teamId, 5),
    seasonPromise,
    seasonBestTimesPromise,
    getOrganizationTeamType(teamId),
    db
      .select({
        name: organization.name,
        usaSwimmingClubId: organization.usaSwimmingClubId,
      })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    session?.user?.id
      ? getUserTeams(session.user.id).then((teams) => {
          const ids = teams.filter((t) => t.id !== teamId).map((t) => t.id);
          return getUpcomingMeetsForOrganizations(ids, calendarFrom, 6);
        })
      : Promise.resolve([]),
  ]);

  const volumeSeries = volumeSeriesResult.series;
  const volumeUnit30 = volumeSeriesResult.distanceUnit;

  const upcomingMeets = meets
    .filter((meet) => formatDateOnly(meet.startDate) >= todayKey)
    .slice()
    .sort((a, b) =>
      formatDateOnly(a.startDate).localeCompare(formatDateOnly(b.startDate)),
    )
    .slice(0, 4);

  const safeSportRequired = requiresSafeSportCompliance(teamType);
  const showUsaSwimming = supportsUsaSwimmingIntegration(teamType);

  const [entryProgressCounts, compliance, member, swimsSummary] =
    await Promise.all([
      getMeetEntryProgressCounts(upcomingMeets.map((m) => m.id)),
      safeSportRequired ? getComplianceSummary(teamId) : Promise.resolve(null),
      safeSportRequired && session?.user?.id
        ? getMember(session.user.id, teamId)
        : Promise.resolve(null),
      showUsaSwimming
        ? getSwimsDashboardSummary(teamId)
        : Promise.resolve(null),
    ]);

  const safeSportCurrent =
    !safeSportRequired || !member
      ? true
      : await hasCurrentSafeSportTraining(member.id);

  const upcomingEvents = calendarEvents
    .filter((event) => {
      const start = new Date(event.startsAt);
      if (event.source === "meet") {
        return formatDateOnly(start) >= todayKey;
      }
      return start >= calendarFrom;
    })
    .slice()
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    .slice(0, 6);

  const attendanceDelta = seriesDelta(attendanceSeries.map((d) => d.rate));
  const volumeDelta = seriesDelta(volumeSeries.map((d) => d.distance));
  const latestAttendance = attendanceSeries.at(-1);
  const showCompliance =
    safeSportRequired &&
    compliance != null &&
    (!safeSportCurrent ||
      compliance.coachesNeedingTraining > 0 ||
      compliance.minorAckTotal > compliance.minorAckCompleted);

  const recentBestTimes = seasonBestTimes.map((bt) => ({
    swimmerId: bt.swimmerId,
    swimmerName: `${bt.firstName} ${bt.lastName}`,
    eventLabel: formatBestTimeEventLabel(
      bt.eventLabel,
      bt.course,
      bt.eventGender,
      teamType,
    ),
    timeMs: bt.timeMs,
    achievedAt: bt.achievedAt?.toISOString() ?? null,
  }));

  const seasonPhase = season
    ? (seasonTrainingPhase(todayKey, season.startsOn, season.endsOn)?.status ??
      "none")
    : "none";
  const seasonStartsLabel = season
    ? (() => {
        const start = parseDateOnly(season.startsOn);
        return start
          ? formatDateOnlyLabel(start, undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : season.startsOn;
      })()
    : undefined;

  const nextMeetDays =
    upcomingMeets[0] != null
      ? daysUntilDate(formatDateOnly(upcomingMeets[0].startDate), todayKey)
      : null;

  const usaClubId = org?.usaSwimmingClubId ?? null;

  const attendanceDeltaLabel =
    attendanceDelta == null || attendanceDelta === 0
      ? undefined
      : `${attendanceDelta > 0 ? "+" : ""}${attendanceDelta}% vs earlier half`;

  const volumeUnit = summary.volumeUnit7Days;
  const volumeUnitLabel =
    volumeUnit === "meters"
      ? "meters"
      : volumeUnit === "yards"
        ? "yards"
        : null;

  const volumeMetaParts = [`${summary.workouts7Days} workouts`];
  if (volumeUnitLabel && summary.workouts7Days > 0) {
    volumeMetaParts.push(volumeUnitLabel);
  }

  const volumeDeltaLabel =
    volumeDelta == null || volumeDelta === 0 || summary.volume7Days === 0
      ? undefined
      : `${volumeDelta > 0 ? "+" : volumeDelta < 0 ? "−" : ""}${formatDistance(Math.abs(volumeDelta))}${
          volumeUnitLabel ? ` ${volumeUnitLabel}` : ""
        }`;

  const volume30UnitLabel =
    volumeUnit30 === "meters"
      ? "meters"
      : volumeUnit30 === "yards"
        ? "yards"
        : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={dashboardDescription(weekLabel, season, todayKey)}
        actions={
          <>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/team/${teamId}/attendance`} />}
            >
              Attendance
            </Button>
            <Button
              nativeButton={false}
              render={<Link href={`/team/${teamId}/swimmers/create`} />}
            >
              Add swimmer
            </Button>
          </>
        }
      />

      {showCompliance ? (
        <Card className="border-amber-500/40 ring-amber-500/20">
          <CardHeader>
            <CardTitle>SafeSport attention</CardTitle>
            <CardDescription>Action may be required</CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/settings/safesport`} />}
              >
                Open
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            {!safeSportCurrent ? (
              <p>
                Your SafeSport training is not current. Complete training at{" "}
                <a
                  href="https://safesporttrained.org"
                  className="text-primary underline"
                >
                  safesporttrained.org
                </a>{" "}
                before accessing minor contact data.
              </p>
            ) : null}
            {compliance.coachesNeedingTraining > 0 ? (
              <p>
                {compliance.coachesNeedingTraining} coach
                {compliance.coachesNeedingTraining === 1 ? "" : "es"} need
                current SafeSport training.
              </p>
            ) : null}
            {compliance.minorAckTotal > compliance.minorAckCompleted ? (
              <p>
                {compliance.minorAckTotal - compliance.minorAckCompleted} minor
                swimmer
                {compliance.minorAckTotal - compliance.minorAckCompleted === 1
                  ? ""
                  : "s"}{" "}
                missing MAAPP acknowledgment for {compliance.seasonYear}.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active roster"
          value={String(rosterStats.totalSwimmers)}
          meta={`${rosterStats.minorSwimmers} minors · ${rosterStats.practiceGroups} groups`}
          href={`/team/${teamId}/roster`}
          linkLabel="Roster"
          icon={UsersIcon}
          iconClassName="text-chart-1"
          iconBgClassName="bg-chart-1/10 text-chart-1"
        />
        <StatCard
          title="Attendance · 30d"
          value={
            summary.attendanceRate30 != null
              ? `${summary.attendanceRate30}%`
              : "—"
          }
          meta={`${summary.sessions30} sessions${latestAttendance ? ` · last ${latestAttendance.rate}%` : ""}`}
          delta={attendanceDeltaLabel}
          deltaPositive={attendanceDelta == null ? true : attendanceDelta >= 0}
          href={`/team/${teamId}/attendance`}
          linkLabel="Track"
          icon={ClipboardCheckIcon}
          iconClassName="text-chart-2"
          iconBgClassName="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          title="Volume · 7d"
          value={formatDistance(summary.volume7Days)}
          meta={volumeMetaParts.join(" · ")}
          delta={volumeDeltaLabel}
          deltaPositive={volumeDelta == null ? true : volumeDelta >= 0}
          href={`/team/${teamId}/workouts`}
          linkLabel="Workouts"
          icon={DumbbellIcon}
          iconClassName="text-chart-3"
          iconBgClassName="bg-chart-3/10 text-chart-3"
        />
        <StatCard
          title="Upcoming meets"
          value={String(upcomingMeets.length)}
          meta={
            upcomingMeets[0]
              ? nextMeetDays != null && nextMeetDays <= 0
                ? `${upcomingMeets[0].name} · today`
                : nextMeetDays != null
                  ? `${upcomingMeets[0].name} · in ${nextMeetDays}d`
                  : upcomingMeets[0].name
              : `${meets.length} total on file`
          }
          href={`/team/${teamId}/meets`}
          linkLabel="Meets"
          icon={CalendarDaysIcon}
          iconClassName="text-chart-4"
          iconBgClassName="bg-chart-4/10 text-chart-4"
        />
      </div>

      {otherTeamMeets.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Other teams</CardTitle>
            <CardDescription>
              Upcoming meets on workspaces besides this one
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {otherTeamMeets.map((meet) => (
              <DashboardListRow
                key={meet.id}
                href={`/team/${meet.organizationId}/meets/${meet.id}`}
                title={meet.name}
                meta={`${meet.teamName} · ${meet.startDate.toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  },
                )}`}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <RecentBestTimesCard
          teamId={teamId}
          times={recentBestTimes}
          seasonLabel={season?.label}
          seasonPhase={seasonPhase}
          seasonStartsLabel={seasonStartsLabel}
        />
        <div className="flex h-full flex-col gap-4">
          <NextCompetitionCard
            teamId={teamId}
            todayKey={todayKey}
            meet={
              upcomingMeets[0]
                ? {
                    id: upcomingMeets[0].id,
                    name: upcomingMeets[0].name,
                    startDate: upcomingMeets[0].startDate,
                    location: upcomingMeets[0].location,
                    athletesEntered:
                      entryProgressCounts.get(upcomingMeets[0].id)
                        ?.athletesEntered ?? 0,
                  }
                : null
            }
          />
          <MeetEntryDeadlinesCard
            teamId={teamId}
            todayKey={todayKey}
            meets={upcomingMeets.map((meet) => {
              const progress = entryProgressCounts.get(meet.id);
              return {
                id: meet.id,
                name: meet.name,
                entryDeadline: meet.entryDeadline,
                startDate: meet.startDate,
                athletesEntered: progress?.athletesEntered ?? 0,
                entryCount: progress?.entryCount ?? 0,
              };
            })}
          />
        </div>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Session rate · last 30 days</CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/attendance`} />}
              >
                Track
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <AttendanceChart
              data={attendanceSeries}
              className="h-52 min-h-52"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training volume</CardTitle>
            <CardDescription>
              Daily {volume30UnitLabel ?? "distance"} · last 30 days
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/analytics`} />}
              >
                Analytics
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <VolumeChart
              data={volumeSeries}
              distanceUnit={volumeUnit30}
              className="h-52 min-h-52"
            />
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <span className="text-muted-foreground text-xs">
              30-day total {formatDistance(summary.volume30Days)}
              {volume30UnitLabel ? ` ${volume30UnitLabel}` : ""} ·{" "}
              {summary.bestTimeCount} best times
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <TrendingUpIcon className="size-3.5" />
              {summary.rsvpAttending} RSVP yes
            </span>
          </CardFooter>
        </Card>
      </div>

      <div
        className={
          showUsaSwimming
            ? "grid items-stretch gap-4 lg:grid-cols-2"
            : "grid items-stretch gap-4"
        }
      >
        <Card className="gap-0">
          <CardHeader className="pb-(--card-spacing)">
            <CardTitle>Coming up</CardTitle>
            <CardDescription>Next 14 days on the calendar</CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/calendar`} />}
              >
                Calendar
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pb-(--card-spacing)">
            {upcomingEvents.length === 0 ? (
              <p className="text-muted-foreground py-6 text-sm">
                Nothing scheduled in the next two weeks.
              </p>
            ) : (
              <div className="flex flex-col">
                {upcomingEvents.map((event) => {
                  const href = event.meetId
                    ? `/team/${teamId}/meets/${event.meetId}`
                    : event.practiceSessionId
                      ? `/team/${teamId}/attendance/${event.practiceSessionId}`
                      : `/team/${teamId}/calendar`;
                  const start = new Date(event.startsAt);
                  return (
                    <DashboardListRow
                      key={event.id}
                      href={href}
                      title={event.title}
                      meta={[
                        formatEventWhen(start, event.source),
                        event.location?.trim() || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      trailing={
                        event.source === "meet"
                          ? "Meet"
                          : event.source === "practice"
                            ? "Practice"
                            : "Event"
                      }
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
          {recentWorkouts.length > 0 ? (
            <CardFooter className="flex-col items-stretch gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Recent workouts
              </span>
              <div className="flex flex-col">
                {recentWorkouts.slice(0, 3).map((workout) => (
                  <DashboardListRow
                    key={workout.id}
                    href={`/team/${teamId}/workouts/${workout.id}`}
                    title={workout.title}
                    meta={workout.createdAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    trailing={
                      workout.totalDistance != null
                        ? `${workout.totalDistance.toLocaleString()}${
                            workout.distanceUnit === "meters"
                              ? " m"
                              : workout.distanceUnit === "yards"
                                ? " yd"
                                : ""
                          }`
                        : null
                    }
                  />
                ))}
              </div>
            </CardFooter>
          ) : (
            <CardFooter>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href={`/team/${teamId}/workouts/create`} />}
              >
                Create workout
              </Button>
            </CardFooter>
          )}
        </Card>

        {showUsaSwimming && swimsSummary ? (
          <SwimsConnectionWidget
            teamId={teamId}
            teamName={org?.name ?? "Team"}
            clubId={usaClubId}
            usasMembers={swimsSummary.usasMembers}
            notInCommit={swimsSummary.notInCommit}
            inactiveInCommit={swimsSummary.inactiveInCommit}
            nonAthletes={swimsSummary.nonAthletes}
            lastSyncedAt={swimsSummary.lastSyncedAt?.toISOString() ?? null}
          />
        ) : null}
      </div>
    </div>
  );
}
