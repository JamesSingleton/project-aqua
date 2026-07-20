import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import {
  attendanceRecords,
  practiceSessions,
  swimmerBestTimes,
  teamSwimmerMemberships,
  workouts,
} from "../schema/index";

export async function getAnalyticsSummary(organizationId: string) {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [volume7] = await db
    .select({
      totalDistance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
      workoutCount: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.organizationId, organizationId),
        gte(workouts.createdAt, since7),
      ),
    );

  const [volume30] = await db
    .select({
      totalDistance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
      workoutCount: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.organizationId, organizationId),
        gte(workouts.createdAt, since30),
      ),
    );

  const sessions = await db
    .select({ id: practiceSessions.id })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.organizationId, organizationId),
        gte(practiceSessions.date, since30),
      ),
    );

  let present = 0;
  let total = 0;
  let rsvpAttending = 0;
  for (const session of sessions) {
    const records = await db
      .select({
        status: attendanceRecords.status,
        rsvpStatus: attendanceRecords.rsvpStatus,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.practiceSessionId, session.id));
    for (const r of records) {
      total += 1;
      if (r.status === "present" || r.status === "late") present += 1;
      if (r.rsvpStatus === "attending") rsvpAttending += 1;
    }
  }

  const [bestTimes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(swimmerBestTimes)
    .innerJoin(
      teamSwimmerMemberships,
      eq(teamSwimmerMemberships.swimmerId, swimmerBestTimes.swimmerId),
    )
    .where(
      and(
        eq(teamSwimmerMemberships.organizationId, organizationId),
        isNull(teamSwimmerMemberships.leftAt),
      ),
    );

  return {
    volume7Days: Number(volume7?.totalDistance ?? 0),
    workouts7Days: Number(volume7?.workoutCount ?? 0),
    volume30Days: Number(volume30?.totalDistance ?? 0),
    workouts30Days: Number(volume30?.workoutCount ?? 0),
    attendanceRate30: total > 0 ? Math.round((present / total) * 100) : null,
    sessions30: sessions.length,
    rsvpAttending,
    bestTimeCount: Number(bestTimes?.count ?? 0),
  };
}
