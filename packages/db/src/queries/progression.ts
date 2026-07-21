import { isRelayStroke } from "@project-aqua/swim-core/entry-limits";
import type { Course } from "@project-aqua/swim-core/events";
import { isFasterTime } from "@project-aqua/swim-core/times";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "../client";
import { swimEvents } from "../schema/events";
import {
  meetEvents,
  meetResults,
  meets,
  swimmerBestTimes,
  swimmerTimeEntries,
} from "../schema/meets";
import { swimmers, teamSwimmerMemberships } from "../schema/swimmers";

function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Resolve the swimmer's current PR row for a meet/catalog event.
 * Prefer exact eventKey; for individuals also match distance+stroke+course
 * so gendered/open key variants still update the same PR.
 */
export async function findSwimmerBestTime(
  swimmerId: string,
  eventKey: string,
): Promise<typeof swimmerBestTimes.$inferSelect | null> {
  const [exact] = await db
    .select()
    .from(swimmerBestTimes)
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, swimmerId),
        eq(swimmerBestTimes.eventKey, eventKey),
      ),
    )
    .orderBy(asc(swimmerBestTimes.timeMs))
    .limit(1);

  if (exact) return exact;

  const [catalog] = await db
    .select({
      distance: swimEvents.distance,
      stroke: swimEvents.stroke,
      course: swimEvents.course,
      eventType: swimEvents.eventType,
    })
    .from(swimEvents)
    .where(eq(swimEvents.eventKey, eventKey))
    .limit(1);

  if (
    !catalog ||
    catalog.eventType === "relay" ||
    isRelayStroke(catalog.stroke, eventKey)
  ) {
    return null;
  }

  const [sibling] = await db
    .select({
      id: swimmerBestTimes.id,
      swimmerId: swimmerBestTimes.swimmerId,
      eventKey: swimmerBestTimes.eventKey,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
      meetId: swimmerBestTimes.meetId,
      createdAt: swimmerBestTimes.createdAt,
      updatedAt: swimmerBestTimes.updatedAt,
    })
    .from(swimmerBestTimes)
    .innerJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, swimmerId),
        eq(swimEvents.distance, catalog.distance),
        eq(swimEvents.stroke, catalog.stroke),
        eq(swimEvents.course, catalog.course),
        eq(swimEvents.eventType, "individual"),
      ),
    )
    .orderBy(asc(swimmerBestTimes.timeMs))
    .limit(1);

  return sibling ?? null;
}

export async function upsertBestTime(data: {
  swimmerId: string;
  eventKey: string;
  course: Course;
  timeMs: number;
  achievedAt: Date;
  meetId?: string;
}) {
  if (data.timeMs <= 0) return null;

  const [catalog] = await db
    .select({
      distance: swimEvents.distance,
      stroke: swimEvents.stroke,
      eventType: swimEvents.eventType,
      course: swimEvents.course,
    })
    .from(swimEvents)
    .where(eq(swimEvents.eventKey, data.eventKey))
    .limit(1);

  if (
    catalog &&
    (catalog.eventType === "relay" ||
      isRelayStroke(catalog.stroke, data.eventKey))
  ) {
    return null;
  }

  const course = catalog?.course ?? data.course;
  const existing = await findSwimmerBestTime(data.swimmerId, data.eventKey);
  const catalogIdentity = catalog
    ? {
        distance: catalog.distance,
        stroke: catalog.stroke,
        course: catalog.course,
      }
    : null;

  let bestTimeId: string;

  if (existing) {
    if (!isFasterTime(data.timeMs, existing.timeMs)) {
      await collapseSiblingBestTimes({
        swimmerId: data.swimmerId,
        keepId: existing.id,
        catalog: catalogIdentity,
      });
      return existing.id;
    }
    await db
      .update(swimmerBestTimes)
      .set({
        // Keep PR keyed to the event that produced the new best.
        eventKey: data.eventKey,
        course,
        timeMs: data.timeMs,
        achievedAt: data.achievedAt,
        meetId: data.meetId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(swimmerBestTimes.id, existing.id));
    bestTimeId = existing.id;
  } else {
    bestTimeId = generateId();
    await db.insert(swimmerBestTimes).values({
      id: bestTimeId,
      swimmerId: data.swimmerId,
      eventKey: data.eventKey,
      course,
      timeMs: data.timeMs,
      achievedAt: data.achievedAt,
      meetId: data.meetId ?? null,
    });
  }

  await collapseSiblingBestTimes({
    swimmerId: data.swimmerId,
    keepId: bestTimeId,
    catalog: catalogIdentity,
  });

  return bestTimeId;
}

async function collapseSiblingBestTimes(input: {
  swimmerId: string;
  keepId: string;
  catalog: {
    distance: number;
    stroke: string;
    course: Course;
  } | null;
}) {
  if (!input.catalog) return;

  const siblings = await db
    .select({ id: swimmerBestTimes.id })
    .from(swimmerBestTimes)
    .innerJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, input.swimmerId),
        eq(swimEvents.distance, input.catalog.distance),
        eq(swimEvents.stroke, input.catalog.stroke),
        eq(swimEvents.course, input.catalog.course),
        eq(swimEvents.eventType, "individual"),
      ),
    );

  const orphanIds = siblings
    .map((s) => s.id)
    .filter((id) => id !== input.keepId);
  if (orphanIds.length === 0) return;

  await db
    .delete(swimmerBestTimes)
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, input.swimmerId),
        inArray(swimmerBestTimes.id, orphanIds),
      ),
    );
}

/**
 * Coach-facing set: always writes the time (corrections / external club times).
 * Appends a dated time entry when this is a new event PR or a faster swim.
 * Clears meetId when not provided so manual entries aren't tied to a meet.
 */
export async function setBestTime(data: {
  swimmerId: string;
  organizationId: string;
  eventKey: string;
  course: Course;
  timeMs: number;
  achievedAt: Date;
  meetId?: string | null;
  label?: string | null;
}) {
  const [membership] = await db
    .select({ id: teamSwimmerMemberships.id })
    .from(teamSwimmerMemberships)
    .where(
      and(
        eq(teamSwimmerMemberships.swimmerId, data.swimmerId),
        eq(teamSwimmerMemberships.organizationId, data.organizationId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new Error("Swimmer is not on this team");
  }

  if (data.timeMs <= 0) {
    throw new Error("Time must be greater than zero");
  }

  const existing = await findSwimmerBestTime(data.swimmerId, data.eventKey);
  const shouldRecordProgression =
    !existing || isFasterTime(data.timeMs, existing.timeMs);

  let bestTimeId: string;

  if (existing) {
    await db
      .update(swimmerBestTimes)
      .set({
        eventKey: data.eventKey,
        course: data.course,
        timeMs: data.timeMs,
        achievedAt: data.achievedAt,
        meetId: data.meetId === undefined ? existing.meetId : data.meetId,
        updatedAt: new Date(),
      })
      .where(eq(swimmerBestTimes.id, existing.id));
    bestTimeId = existing.id;
  } else {
    bestTimeId = generateId();
    await db.insert(swimmerBestTimes).values({
      id: bestTimeId,
      swimmerId: data.swimmerId,
      eventKey: data.eventKey,
      course: data.course,
      timeMs: data.timeMs,
      achievedAt: data.achievedAt,
      meetId: data.meetId ?? null,
    });
  }

  const [catalog] = await db
    .select({
      distance: swimEvents.distance,
      stroke: swimEvents.stroke,
      course: swimEvents.course,
    })
    .from(swimEvents)
    .where(eq(swimEvents.eventKey, data.eventKey))
    .limit(1);

  await collapseSiblingBestTimes({
    swimmerId: data.swimmerId,
    keepId: bestTimeId,
    catalog: catalog ?? null,
  });

  if (shouldRecordProgression) {
    await insertTimeEntry({
      swimmerId: data.swimmerId,
      eventKey: data.eventKey,
      course: data.course,
      timeMs: data.timeMs,
      achievedAt: data.achievedAt,
      label: data.label,
    });
  }

  return bestTimeId;
}

export async function insertTimeEntry(data: {
  swimmerId: string;
  eventKey: string;
  course: Course;
  timeMs: number;
  achievedAt: Date;
  label?: string | null;
}) {
  const id = generateId();
  await db.insert(swimmerTimeEntries).values({
    id,
    swimmerId: data.swimmerId,
    eventKey: data.eventKey,
    course: data.course,
    timeMs: data.timeMs,
    achievedAt: data.achievedAt,
    source: "manual",
    label: data.label ?? null,
  });
  return id;
}

export async function deleteBestTime(
  bestTimeId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      id: swimmerBestTimes.id,
      swimmerId: swimmerBestTimes.swimmerId,
    })
    .from(swimmerBestTimes)
    .innerJoin(
      teamSwimmerMemberships,
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerBestTimes.swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
      ),
    )
    .where(eq(swimmerBestTimes.id, bestTimeId))
    .limit(1);

  if (!row) return false;

  await db.delete(swimmerBestTimes).where(eq(swimmerBestTimes.id, bestTimeId));
  return true;
}

export async function getSwimmerBestTimes(swimmerId: string) {
  return db
    .select({
      id: swimmerBestTimes.id,
      swimmerId: swimmerBestTimes.swimmerId,
      eventKey: swimmerBestTimes.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
      meetId: swimmerBestTimes.meetId,
      createdAt: swimmerBestTimes.createdAt,
      updatedAt: swimmerBestTimes.updatedAt,
    })
    .from(swimmerBestTimes)
    .leftJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .where(eq(swimmerBestTimes.swimmerId, swimmerId))
    .orderBy(asc(swimmerBestTimes.eventKey));
}

/**
 * Recompute PRs from all non-DQ meet results for a swimmer.
 * Fixes rows that missed upserts or used mismatched event keys.
 */
export async function recomputeBestTimesForSwimmer(swimmerId: string) {
  const rows = await db
    .select({
      eventKey: meetEvents.eventKey,
      course: swimEvents.course,
      meetCourse: meets.course,
      timeMs: meetResults.timeMs,
      meetId: meets.id,
      achievedAt: meets.startDate,
      stroke: meetEvents.stroke,
      eventType: swimEvents.eventType,
    })
    .from(meetResults)
    .innerJoin(meets, eq(meetResults.meetId, meets.id))
    .innerJoin(meetEvents, eq(meetResults.meetEventId, meetEvents.id))
    .leftJoin(swimEvents, eq(swimEvents.eventKey, meetEvents.eventKey))
    .where(
      and(eq(meetResults.swimmerId, swimmerId), eq(meetResults.isDq, false)),
    )
    .orderBy(asc(meetResults.timeMs));

  const seen = new Set<string>();
  for (const row of rows) {
    if (
      row.eventType === "relay" ||
      isRelayStroke(row.stroke, row.eventKey) ||
      row.timeMs <= 0
    ) {
      continue;
    }
    if (seen.has(row.eventKey)) continue;
    seen.add(row.eventKey);

    await upsertBestTime({
      swimmerId,
      eventKey: row.eventKey,
      course: (row.course ?? row.meetCourse ?? "SCY") as Course,
      timeMs: row.timeMs,
      achievedAt: row.achievedAt,
      meetId: row.meetId,
    });
  }
}

/** Top 50 best times for active members of an organization. */
export async function getTeamTopTimes(organizationId: string) {
  return db
    .select({
      swimmerId: swimmerBestTimes.swimmerId,
      eventKey: swimmerBestTimes.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
    })
    .from(swimmerBestTimes)
    .innerJoin(
      teamSwimmerMemberships,
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerBestTimes.swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    )
    .leftJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .orderBy(asc(swimmerBestTimes.timeMs))
    .limit(50);
}

export type ProgressionDateRange = {
  startsOn: string;
  endsOn: string;
};

function endOfDayUtc(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

function startOfDayUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** All best times for active members of an organization (analytics / exploration). */
export async function getTeamBestTimes(organizationId: string) {
  return db
    .select({
      swimmerId: swimmerBestTimes.swimmerId,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      eventKey: swimmerBestTimes.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
    })
    .from(swimmerBestTimes)
    .innerJoin(
      teamSwimmerMemberships,
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerBestTimes.swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    )
    .innerJoin(swimmers, eq(swimmers.id, swimmerBestTimes.swimmerId))
    .leftJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .orderBy(asc(swimmerBestTimes.timeMs));
}

/** Current best times achieved within a season date range (newest first). */
export async function getTeamBestTimesInRange(
  organizationId: string,
  range: ProgressionDateRange,
  limit = 6,
) {
  return db
    .select({
      swimmerId: swimmerBestTimes.swimmerId,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      eventKey: swimmerBestTimes.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
    })
    .from(swimmerBestTimes)
    .innerJoin(
      teamSwimmerMemberships,
      and(
        eq(teamSwimmerMemberships.swimmerId, swimmerBestTimes.swimmerId),
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    )
    .innerJoin(swimmers, eq(swimmers.id, swimmerBestTimes.swimmerId))
    .leftJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .where(
      and(
        gte(swimmerBestTimes.achievedAt, startOfDayUtc(range.startsOn)),
        lte(swimmerBestTimes.achievedAt, endOfDayUtc(range.endsOn)),
      ),
    )
    .orderBy(desc(swimmerBestTimes.achievedAt))
    .limit(limit);
}

export type SwimmerTimeHistoryRow = {
  id: string;
  source: "meet" | "manual";
  timeMs: number;
  place: number | null;
  isDq: boolean;
  meetId: string | null;
  label: string;
  achievedAt: Date;
  course: string;
  eventKey: string;
  eventLabel: string | null;
  eventGender: string | null;
  distance: number | null;
  stroke: string | null;
  eventNumber: number | null;
};

/** Unified meet + manual history for a swimmer (newest first). */
export async function getSwimmerTimeHistory(
  swimmerId: string,
  range?: ProgressionDateRange,
): Promise<SwimmerTimeHistoryRow[]> {
  const meetConditions = [eq(meetResults.swimmerId, swimmerId)];
  const entryConditions = [eq(swimmerTimeEntries.swimmerId, swimmerId)];

  if (range) {
    meetConditions.push(
      gte(meets.startDate, startOfDayUtc(range.startsOn)),
      lte(meets.startDate, endOfDayUtc(range.endsOn)),
    );
    entryConditions.push(
      gte(swimmerTimeEntries.achievedAt, startOfDayUtc(range.startsOn)),
      lte(swimmerTimeEntries.achievedAt, endOfDayUtc(range.endsOn)),
    );
  }

  const [meetRows, entryRows] = await Promise.all([
    db
      .select({
        id: meetResults.id,
        timeMs: meetResults.timeMs,
        place: meetResults.place,
        isDq: meetResults.isDq,
        meetId: meets.id,
        label: meets.name,
        achievedAt: meets.startDate,
        course: meets.course,
        eventKey: meetEvents.eventKey,
        eventLabel: swimEvents.label,
        eventGender: swimEvents.gender,
        distance: meetEvents.distance,
        stroke: meetEvents.stroke,
        eventNumber: meetEvents.eventNumber,
      })
      .from(meetResults)
      .innerJoin(meets, eq(meetResults.meetId, meets.id))
      .innerJoin(meetEvents, eq(meetResults.meetEventId, meetEvents.id))
      .leftJoin(swimEvents, eq(swimEvents.eventKey, meetEvents.eventKey))
      .where(and(...meetConditions)),
    db
      .select({
        id: swimmerTimeEntries.id,
        timeMs: swimmerTimeEntries.timeMs,
        achievedAt: swimmerTimeEntries.achievedAt,
        course: swimmerTimeEntries.course,
        eventKey: swimmerTimeEntries.eventKey,
        eventLabel: swimEvents.label,
        eventGender: swimEvents.gender,
        distance: swimEvents.distance,
        stroke: swimEvents.stroke,
        label: swimmerTimeEntries.label,
      })
      .from(swimmerTimeEntries)
      .leftJoin(
        swimEvents,
        eq(swimEvents.eventKey, swimmerTimeEntries.eventKey),
      )
      .where(and(...entryConditions)),
  ]);

  const merged: SwimmerTimeHistoryRow[] = [
    ...meetRows.map((row) => ({
      id: row.id,
      source: "meet" as const,
      timeMs: row.timeMs,
      place: row.place,
      isDq: row.isDq,
      meetId: row.meetId,
      label: row.label,
      achievedAt: row.achievedAt,
      course: row.course,
      eventKey: row.eventKey,
      eventLabel: row.eventLabel,
      eventGender: row.eventGender,
      distance: row.distance,
      stroke: row.stroke,
      eventNumber: row.eventNumber,
    })),
    ...entryRows.map((row) => ({
      id: row.id,
      source: "manual" as const,
      timeMs: row.timeMs,
      place: null,
      isDq: false,
      meetId: null,
      label: row.label?.trim() || "Manual",
      achievedAt: row.achievedAt,
      course: row.course,
      eventKey: row.eventKey,
      eventLabel: row.eventLabel,
      eventGender: row.eventGender,
      distance: row.distance,
      stroke: row.stroke,
      eventNumber: null,
    })),
  ];

  return merged.sort(
    (a, b) => b.achievedAt.getTime() - a.achievedAt.getTime(),
  );
}

/** @deprecated Prefer getSwimmerTimeHistory */
export async function getSwimmerMeetHistory(swimmerId: string) {
  const rows = await getSwimmerTimeHistory(swimmerId);
  return rows
    .filter((r) => r.source === "meet")
    .map((r) => ({
      id: r.id,
      timeMs: r.timeMs,
      place: r.place,
      isDq: r.isDq,
      meetId: r.meetId ?? "",
      meetName: r.label,
      meetDate: r.achievedAt,
      course: r.course,
      eventKey: r.eventKey,
      eventLabel: r.eventLabel,
      eventGender: r.eventGender,
      distance: r.distance ?? 0,
      stroke: r.stroke ?? "",
      eventNumber: r.eventNumber,
    }));
}

/** Time series for charts: results for an org, optionally filtered by eventKey */
export async function getTeamResultSeries(
  organizationId: string,
  eventKey?: string,
) {
  const rows = await db
    .select({
      swimmerId: meetResults.swimmerId,
      eventKey: meetEvents.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimEvents.course,
      timeMs: meetResults.timeMs,
      meetDate: meets.startDate,
      meetName: meets.name,
      isDq: meetResults.isDq,
    })
    .from(meetResults)
    .innerJoin(meets, eq(meetResults.meetId, meets.id))
    .innerJoin(meetEvents, eq(meetResults.meetEventId, meetEvents.id))
    .leftJoin(swimEvents, eq(swimEvents.eventKey, meetEvents.eventKey))
    .innerJoin(
      teamSwimmerMemberships,
      eq(teamSwimmerMemberships.swimmerId, meetResults.swimmerId),
    )
    .where(
      and(
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
      ),
    )
    .orderBy(asc(meets.startDate));

  if (eventKey) {
    return rows.filter((r) => r.eventKey === eventKey && !r.isDq);
  }
  return rows.filter((r) => !r.isDq);
}

export type SwimmerSeriesRow = {
  eventKey: string;
  eventLabel: string | null;
  eventGender: string | null;
  course: string;
  timeMs: number;
  meetDate: Date;
  meetName: string;
  source: "meet" | "manual";
  isDq: boolean;
};

/** Time series for one swimmer: meet results ∪ manual entries. */
export async function getSwimmerResultSeries(
  swimmerId: string,
  range?: ProgressionDateRange,
): Promise<SwimmerSeriesRow[]> {
  const history = await getSwimmerTimeHistory(swimmerId, range);
  return history
    .filter((r) => !r.isDq && r.timeMs > 0)
    .map((r) => ({
      eventKey: r.eventKey,
      eventLabel: r.eventLabel,
      eventGender: r.eventGender,
      course: r.course,
      timeMs: r.timeMs,
      meetDate: r.achievedAt,
      meetName: r.label,
      source: r.source,
      isDq: r.isDq,
    }))
    .sort((a, b) => a.meetDate.getTime() - b.meetDate.getTime());
}
