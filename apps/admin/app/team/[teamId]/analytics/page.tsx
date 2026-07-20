import { getSession } from "@project-aqua/auth/session";
import { requireTeamMember } from "@project-aqua/db/authz";
import { getAnalyticsSummary } from "@project-aqua/db/queries/analytics";
import {
  getTeamResultSeries,
  getTeamTopTimes,
} from "@project-aqua/db/queries/progression";
import { formatTime } from "@project-aqua/swim-core/times";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import Link from "next/link";
import { PageHeader, TimingBoard } from "@/components/page-header";
import { ProgressionChart } from "@/components/progression-chart";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const [summary, topTimes, series] = await Promise.all([
    getAnalyticsSummary(teamId),
    getTeamTopTimes(teamId),
    getTeamResultSeries(teamId),
  ]);

  const counts = new Map<string, number>();
  for (const row of series) {
    counts.set(row.eventKey, (counts.get(row.eventKey) ?? 0) + 1);
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Training volume, attendance, and meet-result trends."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TimingBoard
          label="7-day volume"
          value={summary.volume7Days.toLocaleString()}
          hint={`${summary.workouts7Days} workouts`}
        />
        <TimingBoard
          label="30-day volume"
          value={summary.volume30Days.toLocaleString()}
          hint={`${summary.workouts30Days} workouts`}
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
        <TimingBoard
          label="Best times"
          value={summary.bestTimeCount}
          hint="From meet results"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {topEvent ? `Result trend · ${topEvent}` : "Result trend"}
          </CardTitle>
          <CardDescription>
            Lower is faster.{" "}
            <Link
              href={`/team/${teamId}/progression`}
              className="text-primary underline"
            >
              Open progression
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressionChart points={chartPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top times sample</CardTitle>
          <CardDescription>
            Recent best times used for meet entry seeding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Import meet results to populate best times.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTimes.slice(0, 15).map((row, i) => (
                  <TableRow key={`${row.swimmerId}-${row.eventKey}-${i}`}>
                    <TableCell>{row.eventKey}</TableCell>
                    <TableCell>{row.course}</TableCell>
                    <TableCell className="font-timing">
                      {formatTime(row.timeMs)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
