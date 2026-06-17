import { getPracticeSessions } from "@project-aqua/db/queries/attendance";
import { getRoster } from "@project-aqua/db/queries/roster";
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
import { AttendanceForm } from "./attendance-form";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [sessions, roster] = await Promise.all([
    getPracticeSessions(teamId),
    getRoster(teamId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Track practice attendance for your team
        </p>
      </div>

      <AttendanceForm teamId={teamId} rosterCount={roster.length} />

      <Card>
        <CardHeader>
          <CardTitle>Practice sessions</CardTitle>
          <CardDescription>Recent practices</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No practice sessions yet. Create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {session.date.toLocaleDateString()}{" "}
                      {session.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{session.location ?? "—"}</TableCell>
                    <TableCell>{session.notes ?? "—"}</TableCell>
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
