import { getDefaultPracticeLocation } from "@project-aqua/db/authz";
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
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { AttendanceForm } from "./attendance-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Attendance",
    description: "Track practice attendance and RSVPs.",
    alternates: { canonical: `/team/${teamId}/attendance` },
  };
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [sessions, roster, defaultLocation] = await Promise.all([
    getPracticeSessions(teamId),
    getRoster(teamId),
    getDefaultPracticeLocation(teamId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Take practice rolls. Gaps feed AI workout suggestions."
      />

      <AttendanceForm
        teamId={teamId}
        rosterCount={roster.length}
        defaultLocation={defaultLocation ?? ""}
      />

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
                      <Link
                        href={`/team/${teamId}/attendance/${session.id}`}
                        className="text-primary underline"
                      >
                        {session.date.toLocaleDateString()}{" "}
                        {session.date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Link>
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
