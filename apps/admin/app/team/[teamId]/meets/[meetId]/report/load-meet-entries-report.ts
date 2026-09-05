import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import {
  getMeetById,
  getMeetEntriesDetailed,
  getMeetEvents,
  getMeetRelayLegsDetailed,
  getMeetRelayTeams,
} from "@project-aqua/db/queries/meets";
import { getRoster } from "@project-aqua/db/queries/roster";
import { organization } from "@project-aqua/db/schema";
import {
  buildMeetEntriesReport,
  type MeetEntriesReport,
  type MeetEntriesReportAthlete,
  type ReportCourse,
} from "@project-aqua/reports";
import { eq } from "drizzle-orm";

export async function loadMeetEntriesReport(
  teamId: string,
  meetId: string,
): Promise<MeetEntriesReport | null> {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  const meet = await getMeetById(meetId, teamId);
  if (!meet) return null;

  const [events, entries, relayLegs, relayTeams, roster, orgRows] =
    await Promise.all([
      getMeetEvents(meetId),
      getMeetEntriesDetailed(meetId),
      getMeetRelayLegsDetailed(meetId),
      getMeetRelayTeams(meetId),
      getRoster(teamId),
      db
        .select({
          name: organization.name,
          teamCode: organization.teamCode,
          lscCode: organization.lscCode,
        })
        .from(organization)
        .where(eq(organization.id, teamId))
        .limit(1),
    ]);

  const org = orgRows[0];
  const athletesByMembershipId = new Map<string, MeetEntriesReportAthlete>(
    roster.map((row) => [
      row.membershipId,
      {
        membershipId: row.membershipId,
        firstName: row.firstName,
        lastName: row.lastName,
        classYear: row.classYear,
        gender: row.gender,
      },
    ]),
  );

  return buildMeetEntriesReport({
    meetName: meet.name,
    startDate: meet.startDate,
    course: meet.course as ReportCourse,
    location: meet.location,
    teamName: org?.name ?? "Team",
    teamCode: org?.teamCode
      ? org.lscCode
        ? `${org.teamCode}-${org.lscCode}`
        : org.teamCode
      : null,
    coachName: session?.user?.name ?? null,
    coachEmail: session?.user?.email ?? null,
    events: events.map((event) => ({
      id: event.id,
      eventNumber: event.eventNumber,
      stroke: event.stroke,
      distance: event.distance,
      gender: event.gender,
      eventKey: event.eventKey,
    })),
    entries: entries.map((entry) => ({
      id: entry.id,
      meetEventId: entry.meetEventId,
      membershipId: entry.membershipId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      seedTimeMs: entry.seedTimeMs,
      exhibition: entry.exhibition,
      status: entry.status,
      stroke: entry.stroke,
      eventKey: entry.eventKey,
      gender: entry.gender,
    })),
    relayLegs: relayLegs.map((leg) => ({
      meetEventId: leg.meetEventId,
      relayLetter: leg.relayLetter,
      legOrder: leg.legOrder,
      membershipId: leg.membershipId,
      firstName: leg.firstName,
      lastName: leg.lastName,
    })),
    relayTeamSeeds: relayTeams.map((team) => ({
      meetEventId: team.meetEventId,
      relayLetter: team.relayLetter,
      seedTimeMs: team.seedTimeMs,
    })),
    athletesByMembershipId,
  });
}
