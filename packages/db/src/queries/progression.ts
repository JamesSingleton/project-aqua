import type { Course } from "@project-aqua/swim-core/events";
import { isFasterTime } from "@project-aqua/swim-core/times";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { meetResults, swimmerBestTimes } from "../schema/index.js";

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
    .select()
    .from(swimmerBestTimes)
    .where(eq(swimmerBestTimes.swimmerId, swimmerId))
    .orderBy(asc(swimmerBestTimes.eventKey));
}

export async function getTeamTopTimes(organizationId: string) {
  const results = await db
    .select({
      swimmerId: meetResults.swimmerId,
      eventKey: swimmerBestTimes.eventKey,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
      achievedAt: swimmerBestTimes.achievedAt,
    })
    .from(swimmerBestTimes)
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
    .select()
    .from(meetResults)
    .where(eq(meetResults.swimmerId, swimmerId))
    .orderBy(asc(meetResults.createdAt));
}
