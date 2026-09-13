import { and, asc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import {
  attendanceRecords,
  practiceSessions,
  swimmerBestTimes,
  teamSwimmerMemberships,
  workouts,
} from "../schema/index";

export type WorkoutDistanceUnit = "yards" | "meters";

function resolveDistanceUnit(
  units: Array<WorkoutDistanceUnit | null>,
): WorkoutDistanceUnit | null {
  const known = units.filter((u): u is WorkoutDistanceUnit => u != null);
  if (known.length === 0) return null;
  const unique = new Set(known);
  if (unique.size === 1) return known[0] ?? null;
  return null;
}

export async function getAnalyticsSummary(organizationId: string) {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const [volume7Rows, volume30Rows, attendance, sessionCount, bestTimes] =
    await Promise.all([
      db
        .select({
          totalDistance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
          workoutCount: sql<number>`count(${workouts.id})`,
          distanceUnit: workouts.distanceUnit,
        })
        .from(workouts)
        .where(
          and(
            eq(workouts.organizationId, organizationId),
            gte(workouts.createdAt, since7),
          ),
        )
        .groupBy(workouts.distanceUnit),
      db
        .select({
          totalDistance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
          workoutCount: sql<number>`count(${workouts.id})`,
          distanceUnit: workouts.distanceUnit,
        })
        .from(workouts)
        .where(
          and(
            eq(workouts.organizationId, organizationId),
            gte(workouts.createdAt, since30),
          ),
        )
        .groupBy(workouts.distanceUnit),
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

  const volume7Days = volume7Rows.reduce(
    (sum, row) => sum + Number(row.totalDistance ?? 0),
    0,
  );
  const workouts7Days = volume7Rows.reduce(
    (sum, row) => sum + Number(row.workoutCount ?? 0),
    0,
  );
  const volume30Days = volume30Rows.reduce(
    (sum, row) => sum + Number(row.totalDistance ?? 0),
    0,
  );
  const workouts30Days = volume30Rows.reduce(
    (sum, row) => sum + Number(row.workoutCount ?? 0),
    0,
  );

  const total = Number(attendance?.total ?? 0);
  const present = Number(attendance?.present ?? 0);

  return {
    volume7Days,
    workouts7Days,
    volumeUnit7Days: resolveDistanceUnit(
      volume7Rows.map((row) => row.distanceUnit),
    ),
    volume30Days,
    workouts30Days,
    volumeUnit30Days: resolveDistanceUnit(
      volume30Rows.map((row) => row.distanceUnit),
    ),
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
): Promise<{
  series: Array<{ date: string; distance: number }>;
  distanceUnit: WorkoutDistanceUnit | null;
}> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const [rows, unitRows] = await Promise.all([
    db
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
      .orderBy(sql`date_trunc('day', ${workouts.createdAt})`),
    db
      .select({ distanceUnit: workouts.distanceUnit })
      .from(workouts)
      .where(
        and(
          eq(workouts.organizationId, organizationId),
          gte(workouts.createdAt, since),
        ),
      ),
  ]);

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

  return {
    series,
    distanceUnit: resolveDistanceUnit(unitRows.map((r) => r.distanceUnit)),
  };
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
