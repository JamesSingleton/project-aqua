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
import {
  SwimmerEventChart,
  type SwimmerSeriesPoint,
} from "@/components/swimmer-event-chart";
import { formatBestTimeEventLabel } from "@/lib/format-event-label";

export type SwimmerBestTimeRow = {
  id: string;
  eventKey: string;
  eventLabel: string | null;
  eventGender: string | null;
  course: string;
  timeMs: number;
  achievedAt: Date;
};

export type SwimmerMeetHistoryRow = {
  id: string;
  timeMs: number;
  place: number | null;
  isDq: boolean;
  meetName: string;
  meetDate: Date;
  course: string;
  eventLabel: string | null;
  eventGender: string | null;
};

export function SwimmerProgressionPanel({
  series,
  bestTimes,
  meetHistory,
  teamType,
}: {
  series: SwimmerSeriesPoint[];
  bestTimes: SwimmerBestTimeRow[];
  meetHistory: SwimmerMeetHistoryRow[];
  teamType?: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Time trend</CardTitle>
          <CardDescription>
            Select an event to see times across meets (lower is faster).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SwimmerEventChart series={series} teamType={teamType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Best times</CardTitle>
          <CardDescription>Personal records</CardDescription>
        </CardHeader>
        <CardContent>
          {bestTimes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No times recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bestTimes.map((bt) => (
                  <TableRow key={bt.id}>
                    <TableCell>
                      {formatBestTimeEventLabel(
                        bt.eventLabel,
                        bt.course,
                        bt.eventGender,
                        teamType,
                      )}
                    </TableCell>
                    <TableCell>{bt.course}</TableCell>
                    <TableCell className="font-mono font-timing">
                      {formatTime(bt.timeMs)}
                    </TableCell>
                    <TableCell>{bt.achievedAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meet history</CardTitle>
          <CardDescription>{meetHistory.length} results</CardDescription>
        </CardHeader>
        <CardContent>
          {meetHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No meet results.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meet</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>DQ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetHistory.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      {result.meetDate.toLocaleDateString()}
                    </TableCell>
                    <TableCell>{result.meetName}</TableCell>
                    <TableCell>
                      {formatBestTimeEventLabel(
                        result.eventLabel,
                        result.course,
                        result.eventGender,
                        teamType,
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-timing">
                      {formatTime(result.timeMs)}
                    </TableCell>
                    <TableCell>{result.place ?? "—"}</TableCell>
                    <TableCell>{result.isDq ? "Yes" : "No"}</TableCell>
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
