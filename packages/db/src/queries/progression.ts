import type { Course } from "@project-aqua/swim-core/events";
import { isFasterTime } from "@project-aqua/swim-core/times";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { swimEvents } from "../schema/events";
import {
  meetEvents,
  meetResults,
  meets,
  swimmerBestTimes,
} from "../schema/meets";
import { teamSwimmerMemberships } from "../schema/swimmers";

function generateId(): string {
  return crypto.randomUUID();
}

export async function upsertBestTime(data: {
  swimmerId: string;
  eventKey: string;
  course: Course;
  timeMs: number;
  achievedAt: Date;
  meetId?: string;
}) {
  const existing = await db
    .select()
    .from(swimmerBestTimes)
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, data.swimmerId),
        eq(swimmerBestTimes.eventKey, data.eventKey),
        eq(swimmerBestTimes.course, data.course),
      ),
    )
    .limit(1);

  if (existing[0]) {
    if (!isFasterTime(data.timeMs, existing[0].timeMs)) {
      return existing[0].id;
    }
    await db
      .update(swimmerBestTimes)
      .set({
        timeMs: data.timeMs,
        achievedAt: data.achievedAt,
        meetId: data.meetId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(swimmerBestTimes.id, existing[0].id));
    return existing[0].id;
  }

  const id = generateId();
  await db.insert(swimmerBestTimes).values({
    id,
    swimmerId: data.swimmerId,
    eventKey: data.eventKey,
    course: data.course,
    timeMs: data.timeMs,
    achievedAt: data.achievedAt,
    meetId: data.meetId ?? null,
  });
  return id;
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

export async function getTeamTopTimes(organizationId: string) {
  const results = await db
    .select({
      swimmerId: meetResults.swimmerId,
      eventKey: swimmerBestTimes.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
    })
    .from(swimmerBestTimes)
    .leftJoin(swimEvents, eq(swimEvents.eventKey, swimmerBestTimes.eventKey))
    .innerJoin(
      meetResults,
      eq(meetResults.swimmerId, swimmerBestTimes.swimmerId),
    )
    .orderBy(asc(swimmerBestTimes.timeMs))
    .limit(50);

  return results;
}

export async function getSwimmerMeetHistory(swimmerId: string) {
  return db
    .select({
      id: meetResults.id,
      timeMs: meetResults.timeMs,
      place: meetResults.place,
      isDq: meetResults.isDq,
      meetId: meets.id,
      meetName: meets.name,
      meetDate: meets.startDate,
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
    .where(eq(meetResults.swimmerId, swimmerId))
    .orderBy(desc(meets.startDate), asc(meetEvents.eventNumber));
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

/** Time series for one swimmer across meets. */
export async function getSwimmerResultSeries(swimmerId: string) {
  const rows = await db
    .select({
      eventKey: meetEvents.eventKey,
      eventLabel: swimEvents.label,
      eventGender: swimEvents.gender,
      course: meets.course,
      timeMs: meetResults.timeMs,
      meetDate: meets.startDate,
      meetName: meets.name,
      isDq: meetResults.isDq,
    })
    .from(meetResults)
    .innerJoin(meets, eq(meetResults.meetId, meets.id))
    .innerJoin(meetEvents, eq(meetResults.meetEventId, meetEvents.id))
    .leftJoin(swimEvents, eq(swimEvents.eventKey, meetEvents.eventKey))
    .where(eq(meetResults.swimmerId, swimmerId))
    .orderBy(asc(meets.startDate));

  return rows.filter((r) => !r.isDq);
}
