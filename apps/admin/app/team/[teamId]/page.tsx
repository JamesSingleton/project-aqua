import { getSession } from "@project-aqua/auth/session";
import { getMember, hasCurrentSafeSportTraining } from "@project-aqua/db/authz";
import { getAttendanceSummary } from "@project-aqua/db/queries/attendance";
import { getMeets } from "@project-aqua/db/queries/meets";
import { getRosterStats } from "@project-aqua/db/queries/roster";
import { getComplianceSummary } from "@project-aqua/db/queries/safesport";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";

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

export default async function TeamDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  const [rosterStats, attendance, meets, compliance, member] =
    await Promise.all([
      getRosterStats(teamId),
      getAttendanceSummary(teamId),
      getMeets(teamId),
      getComplianceSummary(teamId),
      session?.user?.id
        ? getMember(session.user.id, teamId)
        : Promise.resolve(null),
    ]);

  const safeSportCurrent = member
    ? await hasCurrentSafeSportTraining(member.id)
    : true;

  const upcomingMeets = meets.slice(0, 3);
  const latestAttendance = attendance[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Quick overview of your swim team
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Swimmers</CardTitle>
            <CardDescription>Active roster</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{rosterStats.totalSwimmers}</p>
            <p className="text-muted-foreground text-sm">
              {rosterStats.minorSwimmers} minors
            </p>
            <Link
              href={`/team/${teamId}/roster`}
              className="text-primary text-sm underline"
            >
              View roster
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Latest practice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {latestAttendance ? `${latestAttendance.rate}%` : "—"}
            </p>
            <Link
              href={`/team/${teamId}/attendance`}
              className="text-primary text-sm underline"
            >
              Track attendance
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meets</CardTitle>
            <CardDescription>Scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{meets.length}</p>
            <Link
              href={`/team/${teamId}/meets`}
              className="text-primary text-sm underline"
            >
              View meets
            </Link>
          </CardContent>
        </Card>
      </div>

      {(!safeSportCurrent ||
        compliance.coachesNeedingTraining > 0 ||
        compliance.minorAckTotal > compliance.minorAckCompleted) && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle>SafeSport compliance</CardTitle>
            <CardDescription>Action may be required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!safeSportCurrent && (
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
            )}
            {compliance.coachesNeedingTraining > 0 && (
              <p>
                {compliance.coachesNeedingTraining} coach(es) need current
                SafeSport training.
              </p>
            )}
            {compliance.minorAckTotal > compliance.minorAckCompleted && (
              <p>
                {compliance.minorAckTotal - compliance.minorAckCompleted} minor
                swimmer(s) missing MAAPP acknowledgment for{" "}
                {compliance.seasonYear}.
              </p>
            )}
            <Link
              href={`/team/${teamId}/settings/safesport`}
              className="text-primary underline"
            >
              Open SafeSport settings
            </Link>
          </CardContent>
        </Card>
      )}

      {upcomingMeets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming meets</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcomingMeets.map((meet) => (
                <li key={meet.id}>
                  <Link
                    href={`/team/${teamId}/meets/${meet.id}`}
                    className="text-primary underline"
                  >
                    {meet.name}
                  </Link>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {meet.startDate.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
