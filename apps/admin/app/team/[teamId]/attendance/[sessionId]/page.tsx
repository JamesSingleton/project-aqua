import { getSession } from "@project-aqua/auth/session";
import { requireTeamMember } from "@project-aqua/db/authz";
import {
  getAttendanceForSession,
  getPracticeSessions,
} from "@project-aqua/db/queries/attendance";
import { getRoster } from "@project-aqua/db/queries/roster";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceRoll } from "./attendance-roll";

export default async function AttendanceSessionPage({
  params,
}: {
  params: Promise<{ teamId: string; sessionId: string }>;
}) {
  const { teamId, sessionId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const [sessions, roster, records] = await Promise.all([
    getPracticeSessions(teamId),
    getRoster(teamId),
    getAttendanceForSession(sessionId),
  ]);

  const practice = sessions.find((s) => s.id === sessionId);
  if (!practice) notFound();

  const recordByMembership = new Map(
    records.map((r) => [
      r.membershipId,
      {
        status: r.status,
        rsvpStatus: r.rsvpStatus,
        absenceReason: r.absenceReason,
      },
    ]),
  );

  const rows = roster.map((swimmer) => {
    const record = recordByMembership.get(swimmer.membershipId);
    return {
      membershipId: swimmer.membershipId,
      name: swimmer.preferredName
        ? `${swimmer.preferredName} (${swimmer.firstName} ${swimmer.lastName})`
        : `${swimmer.firstName} ${swimmer.lastName}`,
      practiceGroup: swimmer.practiceGroup,
      status: record?.status ?? "present",
      rsvpStatus: record?.rsvpStatus ?? "unknown",
      absenceReason: record?.absenceReason ?? null,
    };
  });

  const rsvpAttending = rows.filter((r) => r.rsvpStatus === "attending").length;
  const rsvpAbsent = rows.filter((r) => r.rsvpStatus === "absent").length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/team/${teamId}/attendance`}
          className="text-muted-foreground text-sm underline"
        >
          ← All sessions
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Take attendance
        </h1>
        <p className="text-muted-foreground">
          {practice.date.toLocaleDateString()}{" "}
          {practice.date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {practice.location ? ` · ${practice.location}` : ""}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          RSVP: {rsvpAttending} attending · {rsvpAbsent} absent
          {practice.workoutId ? " · Workout attached" : ""}
        </p>
        {!practice.workoutId && (
          <Link
            href={`/team/${teamId}/workouts/create?practiceSessionId=${sessionId}`}
            className="text-sm underline"
          >
            Attach a workout
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roll call + RSVP</CardTitle>
          <CardDescription>
            RSVP feeds planning; roll status is the authoritative attendance
            record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceRoll teamId={teamId} sessionId={sessionId} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
