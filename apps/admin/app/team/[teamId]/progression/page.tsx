import { getSwimmerBestTimes } from "@project-aqua/db/queries/progression";
import { getRoster } from "@project-aqua/db/queries/roster";
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

export default async function ProgressionPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const roster = await getRoster(teamId);

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
      course: bt.course,
      timeMs: bt.timeMs,
      achievedAt: bt.achievedAt,
    })),
  );

  allTimes.sort((a, b) => a.timeMs - b.timeMs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progression</h1>
        <p className="text-muted-foreground">Best times tracked across meets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team top times</CardTitle>
          <CardDescription>
            Fastest times per event from meet results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No times recorded yet. Import meet results to track progression.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Swimmer</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTimes.slice(0, 50).map((row, i) => (
                  <TableRow key={`${row.swimmerId}-${row.eventKey}-${i}`}>
                    <TableCell>
                      <Link
                        href={`/team/${teamId}/swimmers/${row.swimmerId}`}
                        className="text-primary underline"
                      >
                        {row.swimmerName}
                      </Link>
                    </TableCell>
                    <TableCell>{row.eventKey}</TableCell>
                    <TableCell>{row.course}</TableCell>
                    <TableCell className="font-mono">
                      {formatTime(row.timeMs)}
                    </TableCell>
                    <TableCell>{row.achievedAt.toLocaleDateString()}</TableCell>
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
