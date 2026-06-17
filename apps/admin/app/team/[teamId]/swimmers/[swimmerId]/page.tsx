import { getSession } from "@project-aqua/auth/session";
import {
  getSwimmerAffiliations,
  getClubRegistrationForMembership,
  getSwimmerById,
} from "@project-aqua/db/queries/roster";
import { getSwimmerBestTimes, getSwimmerMeetHistory } from "@project-aqua/db/queries/progression";
import { requireSwimmerTeamAccess } from "@project-aqua/db/authz";
import { isMinorSwimmer } from "@project-aqua/swim-core/age";
import { formatTime } from "@project-aqua/swim-core/times";
import { Badge } from "@project-aqua/ui/components/badge";
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
import { notFound } from "next/navigation";
import { SwimmerProfileTabs } from "./swimmer-profile-tabs";

export default async function SwimmerProfilePage({
  params,
}: {
  params: Promise<{ teamId: string; swimmerId: string }>;
}) {
  const { teamId, swimmerId } = await params;
  const session = await getSession();
  await requireSwimmerTeamAccess(session?.user?.id, swimmerId, teamId);

  const [swimmer, bestTimes, meetHistory, affiliations] = await Promise.all([
      getSwimmerById(swimmerId, teamId),
      getSwimmerBestTimes(swimmerId),
      getSwimmerMeetHistory(swimmerId),
      session?.user?.id
        ? getSwimmerAffiliations(swimmerId, session.user.id)
        : Promise.resolve([]),
    ]);

  if (!swimmer) notFound();

  const clubRegistration = await getClubRegistrationForMembership(
    swimmer.membershipId,
    teamId,
  );

  const displayName = swimmer.preferredName
    ? `${swimmer.preferredName} (${swimmer.firstName} ${swimmer.lastName})`
    : `${swimmer.firstName} ${swimmer.lastName}`;
  const minor = isMinorSwimmer(swimmer.dateOfBirth);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
          {minor && <Badge variant="outline">Minor</Badge>}
        </div>
        <p className="text-muted-foreground">
          {swimmer.gender === "male" ? "Male" : "Female"} ·{" "}
          {swimmer.practiceGroup ?? "No practice group"}
          {swimmer.governingBodyId && (
            <> · USA ID {swimmer.governingBodyId}</>
          )}
        </p>
      </div>

      <SwimmerProfileTabs
        teamId={teamId}
        swimmerId={swimmerId}
        membershipId={swimmer.membershipId}
        isMinor={minor}
        affiliations={affiliations}
        clubRegistration={clubRegistration}
      />

      <Card>
        <CardHeader>
          <CardTitle>Best times</CardTitle>
          <CardDescription>Personal records (all teams)</CardDescription>
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
                    <TableCell>{bt.eventKey}</TableCell>
                    <TableCell>{bt.course}</TableCell>
                    <TableCell className="font-mono">
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
                  <TableHead>Time</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>DQ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetHistory.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-mono">
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
