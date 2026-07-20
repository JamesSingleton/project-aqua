import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
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

  const [volume7, volume30, attendance, sessionCount, bestTimes] =
    await Promise.all([
      db
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
        )
        .then((rows) => rows[0]),
      db
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
        )
        .then((rows) => rows[0]),
      db
        .select({
          total: sql<number>`count(*)`,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} in ('present', 'late'))`,
          rsvpAttending: sql<number>`count(*) filter (where ${attendanceRecords.rsvpStatus} = 'attending')`,
        })
        .from(attendanceRecords)
        .innerJoin(
          practiceSessions,
          eq(attendanceRecords.practiceSessionId, practiceSessions.id),
        )
        .where(
          and(
            eq(practiceSessions.organizationId, organizationId),
            gte(practiceSessions.date, since30),
          ),
        )
        .then((rows) => rows[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(practiceSessions)
        .where(
          and(
            eq(practiceSessions.organizationId, organizationId),
            gte(practiceSessions.date, since30),
          ),
        )
        .then((rows) => rows[0]),
      db
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
        )
        .then((rows) => rows[0]),
    ]);

  const total = Number(attendance?.total ?? 0);
  const present = Number(attendance?.present ?? 0);

  return {
    volume7Days: Number(volume7?.totalDistance ?? 0),
    workouts7Days: Number(volume7?.workoutCount ?? 0),
    volume30Days: Number(volume30?.totalDistance ?? 0),
    workouts30Days: Number(volume30?.workoutCount ?? 0),
    attendanceRate30: total > 0 ? Math.round((present / total) * 100) : null,
    sessions30: Number(sessionCount?.count ?? 0),
    rsvpAttending: Number(attendance?.rsvpAttending ?? 0),
    bestTimeCount: Number(bestTimes?.count ?? 0),
  };
}

/** Daily training volume for the last N days (default 30). */
export async function getVolumeSeries(
  organizationId: string,
  days = 30,
): Promise<Array<{ date: string; distance: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${workouts.createdAt}), 'YYYY-MM-DD')`,
      distance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.organizationId, organizationId),
        gte(workouts.createdAt, since),
      ),
    )
    .groupBy(sql`date_trunc('day', ${workouts.createdAt})`)
    .orderBy(sql`date_trunc('day', ${workouts.createdAt})`);

  const byDate = new Map(rows.map((r) => [r.date, Number(r.distance)]));

  const series: Array<{ date: string; distance: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    series.push({ date: key, distance: byDate.get(key) ?? 0 });
  }
  return series;
}

/** Per-session attendance rates for the last N days (default 30). */
export async function getAttendanceSeries(
  organizationId: string,
  days = 30,
): Promise<
  Array<{ date: string; rate: number; present: number; total: number }>
> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db
    .select({
      date: practiceSessions.date,
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} in ('present', 'late'))`,
    })
    .from(practiceSessions)
    .innerJoin(
      attendanceRecords,
      eq(attendanceRecords.practiceSessionId, practiceSessions.id),
    )
    .where(
      and(
        eq(practiceSessions.organizationId, organizationId),
        gte(practiceSessions.date, since),
      ),
    )
    .groupBy(practiceSessions.id, practiceSessions.date)
    .orderBy(asc(practiceSessions.date));

  return rows
    .map((row) => {
      const total = Number(row.total);
      if (total === 0) return null;
      const present = Number(row.present);
      const date = [
        row.date.getFullYear(),
        String(row.date.getMonth() + 1).padStart(2, "0"),
        String(row.date.getDate()).padStart(2, "0"),
      ].join("-");
      return {
        date,
        present,
        total,
        rate: Math.round((present / total) * 100),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);
}
