import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireTeamMember,
} from "@project-aqua/db/authz";
import {
  getAnalyticsSummary,
  getAttendanceSeries,
  getVolumeSeries,
} from "@project-aqua/db/queries/analytics";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import { getTeamBestTimes } from "@project-aqua/db/queries/progression";
import {
  getTimeStandardCuts,
  listTimeStandardSets,
} from "@project-aqua/db/queries/time-standards";
import { planHasFeature } from "@project-aqua/swim-core/plans";
import { formatBestTimeEventLabel } from "@project-aqua/swim-core/team-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import { AttendanceChart, VolumeChart } from "@/components/analytics-charts";
import { PageHeader, TimingBoard } from "@/components/page-header";
import { TeamTopTimes } from "@/components/team-top-times";
import { CutTrackerCard, type CutTrackerRow } from "./cut-tracker-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Analytics",
    description: "Volume, attendance, and top times for your team.",
    alternates: { canonical: `/team/${teamId}/analytics` },
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const [
    summary,
    volumeSeriesResult,
    attendanceSeries,
    bestTimes,
    teamType,
    plan,
    sets,
  ] = await Promise.all([
    getAnalyticsSummary(teamId),
    getVolumeSeries(teamId, 30),
    getAttendanceSeries(teamId, 30),
    getTeamBestTimes(teamId),
    getOrganizationTeamType(teamId),
    getTeamPlan(teamId),
    listTimeStandardSets(teamId),
  ]);
  const advancedAnalytics = planHasFeature(plan, "advanced_analytics");
  const cuts = advancedAnalytics
    ? (
        await Promise.all(sets.map((set) => getTimeStandardCuts(set.id)))
      ).flatMap((list, i) =>
        list.map((cut) => ({ ...cut, setName: sets[i]!.name })),
      )
    : [];

  const volumeSeries = volumeSeriesResult.series;
  const volumeUnit = volumeSeriesResult.distanceUnit;
  const volumeUnitLabel =
    volumeUnit === "meters"
      ? "meters"
      : volumeUnit === "yards"
        ? "yards"
        : "distance";

  const allTimes = bestTimes.map((bt) => ({
    swimmerName: `${bt.firstName} ${bt.lastName}`,
    swimmerId: bt.swimmerId,
    eventKey: bt.eventKey,
    eventLabel: formatBestTimeEventLabel(
      bt.eventLabel,
      bt.course,
      bt.eventGender,
      teamType,
    ),
    course: bt.course,
    timeMs: bt.timeMs,
    achievedAt: bt.achievedAt.toISOString(),
  }));

  const cutRows: CutTrackerRow[] = [];
  if (advancedAnalytics) {
    for (const bt of bestTimes) {
      for (const cut of cuts) {
        if (cut.eventKey !== bt.eventKey) continue;
        if (
          cut.gender !== "mixed" &&
          bt.eventGender &&
          cut.gender !== bt.eventGender
        ) {
          continue;
        }
        if (bt.timeMs <= 0 || cut.timeMs <= 0 || bt.timeMs > cut.timeMs) {
          continue;
        }
        cutRows.push({
          swimmerName: `${bt.firstName} ${bt.lastName}`,
          eventLabel: formatBestTimeEventLabel(
            bt.eventLabel,
            bt.course,
            bt.eventGender,
            teamType,
          ),
          timeMs: bt.timeMs,
          cutTimeMs: cut.timeMs,
          setName: cut.setName,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Training volume, attendance trends, and team top times."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TimingBoard
          label="7-day volume"
          value={summary.volume7Days.toLocaleString()}
          hint={`${summary.workouts7Days} workouts${
            summary.volumeUnit7Days ? ` · ${summary.volumeUnit7Days}` : ""
          }`}
        />
        <TimingBoard
          label="30-day volume"
          value={summary.volume30Days.toLocaleString()}
          hint={`${summary.workouts30Days} workouts${
            summary.volumeUnit30Days ? ` · ${summary.volumeUnit30Days}` : ""
          }`}
        />
        <TimingBoard
          label="Attendance (30d)"
          value={
            summary.attendanceRate30 != null
              ? `${summary.attendanceRate30}%`
              : "—"
          }
          hint={`${summary.sessions30} sessions · ${summary.rsvpAttending} RSVP yes`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Training volume</CardTitle>
            <CardDescription>
              Daily {volumeUnitLabel} · last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart data={volumeSeries} distanceUnit={volumeUnit} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance rate</CardTitle>
            <CardDescription>
              Present + late per session · last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={attendanceSeries} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Top Times</CardTitle>
          <CardDescription>
            Fastest best times — group and filter to explore the roster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamTopTimes times={allTimes} teamId={teamId} />
        </CardContent>
      </Card>

      <CutTrackerCard
        teamId={teamId}
        rows={cutRows}
        available={advancedAnalytics}
      />
    </div>
  );
}
