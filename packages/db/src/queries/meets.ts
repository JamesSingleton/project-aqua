import { isFasterTime } from "@project-aqua/swim-core/times";
import type { CreateMeetInput } from "@project-aqua/swim-core/validators";
import { desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import {
  meetEntries,
  meetEvents,
  meetResults,
  meets,
} from "../schema/index.js";
import { upsertBestTime } from "./progression.js";

function generateId(): string {
  return crypto.randomUUID();
}

export async function getMeets(organizationId: string) {
  return db
    .select()
    .from(meets)
    .where(eq(meets.organizationId, organizationId))
    .orderBy(desc(meets.startDate));
}

export async function getMeetById(meetId: string, organizationId: string) {
  const [meet] = await db
    .select()
    .from(meets)
    .where(eq(meets.id, meetId))
    .limit(1);

  if (!meet || meet.organizationId !== organizationId) return null;
  return meet;
}

export async function createMeet(
  organizationId: string,
  data: CreateMeetInput,
) {
  const id = generateId();
  await db.insert(meets).values({
    id,
    organizationId,
    name: data.name,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    course: data.course,
    location: data.location ?? null,
  });
  return id;
}

export async function getMeetEvents(meetId: string) {
  return db.select().from(meetEvents).where(eq(meetEvents.meetId, meetId));
}

export async function getMeetEntries(meetId: string) {
  return db.select().from(meetEntries).where(eq(meetEntries.meetId, meetId));
}

export async function addMeetEvent(
  meetId: string,
  event: {
    eventNumber?: number;
    stroke: string;
    distance: number;
    gender: string;
    ageGroup?: string;
    eventKey: string;
  },
) {
  const id = generateId();
  await db.insert(meetEvents).values({
    id,
    meetId,
    ...event,
  });
  return id;
}

export async function addMeetEntry(
  meetId: string,
  meetEventId: string,
  membershipId: string,
  seedTimeMs?: number,
  entryNotes?: string,
) {
  const id = generateId();
  await db.insert(meetEntries).values({
    id,
    meetId,
    meetEventId,
    membershipId,
    seedTimeMs: seedTimeMs ?? null,
    entryNotes: entryNotes ?? null,
  });
  return id;
}

export async function addMeetResult(
  meetId: string,
  meetEventId: string,
  swimmerId: string,
  timeMs: number,
  options?: { place?: number; isDq?: boolean },
) {
  const id = generateId();
  const meet = await db
    .select()
    .from(meets)
    .where(eq(meets.id, meetId))
    .limit(1);

  const course = meet[0]?.course ?? "SCY";
  const event = await db
    .select()
    .from(meetEvents)
    .where(eq(meetEvents.id, meetEventId))
    .limit(1);

  await db.insert(meetResults).values({
    id,
    meetId,
    meetEventId,
    swimmerId,
    timeMs,
    place: options?.place ?? null,
    isDq: options?.isDq ?? false,
  });

  if (event[0] && !options?.isDq) {
    await upsertBestTime({
      swimmerId,
      eventKey: event[0].eventKey,
      course,
      timeMs,
      achievedAt: new Date(),
      meetId,
    });
  }

  return id;
}

export async function getMeetResults(meetId: string) {
  return db.select().from(meetResults).where(eq(meetResults.meetId, meetId));
}
