import { getOrganizationTeamType } from "@project-aqua/db/authz";
import {
  getSwimmerBestTimes,
  getTeamResultSeries,
} from "@project-aqua/db/queries/progression";
import { getRoster } from "@project-aqua/db/queries/roster";
import { formatTime } from "@project-aqua/swim-core/times";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ProgressionChart } from "@/components/progression-chart";
import { formatBestTimeEventLabel } from "./event-label";
import { TeamTopTimes } from "./team-top-times";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Progression",
    description: "Best times and meet result trends for your team.",
    alternates: { canonical: `/team/${teamId}/progression` },
  };
}

export default async function ProgressionPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [roster, series, teamType] = await Promise.all([
    getRoster(teamId),
    getTeamResultSeries(teamId),
    getOrganizationTeamType(teamId),
  ]);

  const swimmersWithTimes = await Promise.all(
    roster.map(async (swimmer) => ({
      ...swimmer,
      bestTimes: await getSwimmerBestTimes(swimmer.swimmerId),
    })),
  );

  const allTimes = swimmersWithTimes.flatMap((s) =>
    s.bestTimes.map((bt) => ({
      swimmerName: `${s.firstName} ${s.lastName}`,
      swimmerId: s.swimmerId,
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
    })),
  );
  allTimes.sort((a, b) => a.timeMs - b.timeMs);

  // Chart: most common eventKey in series
  const counts = new Map<string, number>();
  const labelsByEventKey = new Map<string, string>();
  for (const row of series) {
    counts.set(row.eventKey, (counts.get(row.eventKey) ?? 0) + 1);
    labelsByEventKey.set(
      row.eventKey,
      formatBestTimeEventLabel(
        row.eventLabel,
        row.course ?? "SCY",
        row.eventGender,
        teamType,
      ),
    );
  }
  let topEvent = "";
  let topCount = 0;
  for (const [key, n] of counts) {
    if (n > topCount) {
      topEvent = key;
      topCount = n;
    }
  }

  const chartPoints = series
    .filter((r) => r.eventKey === topEvent)
    .map((r) => ({
      date: r.meetDate.toISOString().slice(0, 10),
      timeMs: r.timeMs,
      label: r.meetName,
    }));

  const topEventLabel = topEvent
    ? (labelsByEventKey.get(topEvent) ?? topEvent)
    : "";

  // Group average improvement: first vs last half of chart points
  let groupTrend: string | null = null;
  if (chartPoints.length >= 4) {
    const mid = Math.floor(chartPoints.length / 2);
    const first =
      chartPoints.slice(0, mid).reduce((s, p) => s + p.timeMs, 0) / mid;
    const second =
      chartPoints.slice(mid).reduce((s, p) => s + p.timeMs, 0) /
      (chartPoints.length - mid);
    const delta = first - second;
    groupTrend =
      delta > 0
        ? `Group avg faster by ${formatTime(Math.round(delta))} on ${topEventLabel}`
        : `Group avg slower by ${formatTime(Math.round(-delta))} on ${topEventLabel}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progression"
        description="Best times and meet result trends from imported files"
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {topEventLabel ? `Trend · ${topEventLabel}` : "Time Trend"}
          </CardTitle>
          <CardDescription>
            {groupTrend ??
              "Lower is faster. Import more meets for a clearer line."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressionChart points={chartPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Top Times</CardTitle>
          <CardDescription>
            Fastest best times — group and filter to explore the roster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamTopTimes times={allTimes} />
        </CardContent>
      </Card>
    </div>
  );
}
