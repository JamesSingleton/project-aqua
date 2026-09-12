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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@project-aqua/ui/components/empty";
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
import { AttendanceRosterEmpty } from "./attendance-roster-empty";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Attendance",
    description: "Practice roll call and RSVPs.",
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
  const hasRoster = roster.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        description="Roll call for each practice."
      />

      {hasRoster ? (
        <AttendanceForm
          teamId={teamId}
          defaultLocation={defaultLocation ?? ""}
        />
      ) : (
        <AttendanceRosterEmpty teamId={teamId} />
      )}

      {hasRoster ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent practices</CardTitle>
            <CardDescription>Past rolls you can reopen or edit</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <Empty className="border-0 p-0">
                <EmptyHeader>
                  <EmptyTitle>No practice rolls yet</EmptyTitle>
                  <EmptyDescription>
                    Use the form above to open your first roll—pick date, pool,
                    then mark who made practice.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
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
      ) : null}
    </div>
  );
}
