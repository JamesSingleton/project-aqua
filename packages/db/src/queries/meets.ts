import {
  formatEventName,
  parseEventGender,
} from "@project-aqua/swim-core/events";
import type { CreateMeetInput } from "@project-aqua/swim-core/validators";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../client";
import {
  type EntryLimitPackage,
  meetCommitments,
  meetEntries,
  meetEvents,
  meetRelayLegs,
  meetResults,
  meets,
  type SeedTimeSource,
  swimEvents,
  swimmerBestTimes,
  swimmers,
  teamSwimmerMemberships,
} from "../schema/index";
import { upsertBestTime } from "./progression";

function generateId(): string {
  return crypto.randomUUID();
}

export async function ensureSwimEvent(event: {
  eventKey: string;
  distance: number;
  stroke: string;
  gender: string;
  course: "SCY" | "SCM" | "LCM";
}) {
  const [existing] = await db
    .select({ eventKey: swimEvents.eventKey })
    .from(swimEvents)
    .where(eq(swimEvents.eventKey, event.eventKey))
    .limit(1);
  if (existing) return;

  const gender = parseEventGender(event.gender);
  const isRelay =
    event.stroke === "free_relay" ||
    event.stroke === "medley_relay" ||
    event.stroke.includes("relay");
  await db.insert(swimEvents).values({
    eventKey: event.eventKey,
    label: formatEventName(event.distance, event.stroke),
    distance: event.distance,
    stroke: event.stroke,
    course: event.course,
    gender,
    eventType: isRelay ? "relay" : "individual",
  });
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
  data: CreateMeetInput & {
    importSource?: string;
    maxIndividualEntries?: number | null;
    maxRelayEntries?: number | null;
    maxCombinedEntries?: number | null;
    entryLimitPackages?: EntryLimitPackage[] | null;
    entryLimitsSource?: string | null;
  },
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
    address: data.address ?? null,
    importSource: data.importSource ?? null,
    maxIndividualEntries: data.maxIndividualEntries ?? null,
    maxRelayEntries: data.maxRelayEntries ?? null,
    maxCombinedEntries: data.maxCombinedEntries ?? null,
    entryLimitPackages: data.entryLimitPackages ?? null,
    entryLimitsSource: data.entryLimitsSource ?? null,
  });
  return id;
}

export async function updateMeet(
  meetId: string,
  organizationId: string,
  data: CreateMeetInput & {
    maxIndividualEntries?: number | null;
    maxRelayEntries?: number | null;
    maxCombinedEntries?: number | null;
    entryLimitPackages?: EntryLimitPackage[] | null;
    entryLimitsSource?: string | null;
  },
) {
  const meet = await getMeetById(meetId, organizationId);
  if (!meet) return false;

  await db
    .update(meets)
    .set({
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      course: data.course,
      location: data.location ?? null,
      address: data.address ?? null,
      ...(data.maxIndividualEntries !== undefined
        ? { maxIndividualEntries: data.maxIndividualEntries }
        : {}),
      ...(data.maxRelayEntries !== undefined
        ? { maxRelayEntries: data.maxRelayEntries }
        : {}),
      ...(data.maxCombinedEntries !== undefined
        ? { maxCombinedEntries: data.maxCombinedEntries }
        : {}),
      ...(data.entryLimitPackages !== undefined
        ? { entryLimitPackages: data.entryLimitPackages }
        : {}),
      ...(data.entryLimitsSource !== undefined
        ? { entryLimitsSource: data.entryLimitsSource }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(meets.id, meetId));

  return true;
}

/** Meets with result/athlete counts for the Results hub list. */
export async function getMeetsWithResultStats(organizationId: string) {
  const meetList = await getMeets(organizationId);
  if (meetList.length === 0) return [];

  const stats = await db
    .select({
      meetId: meetResults.meetId,
      resultCount: sql<number>`count(*)::int`,
      athleteCount: sql<number>`count(distinct ${meetResults.swimmerId})::int`,
    })
    .from(meetResults)
    .where(
      inArray(
        meetResults.meetId,
        meetList.map((m) => m.id),
      ),
    )
    .groupBy(meetResults.meetId);

  const byMeet = new Map(stats.map((s) => [s.meetId, s]));

  return meetList.map((meet) => {
    const s = byMeet.get(meet.id);
    return {
      ...meet,
      resultCount: s?.resultCount ?? 0,
      athleteCount: s?.athleteCount ?? 0,
    };
  });
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
    course?: "SCY" | "SCM" | "LCM";
    qualifyingTimeMs?: number | null;
  },
) {
  const gender = parseEventGender(event.gender);
  await ensureSwimEvent({
    eventKey: event.eventKey,
    distance: event.distance,
    stroke: event.stroke,
    gender,
    course: event.course ?? "SCY",
  });

  const id = generateId();
  await db.insert(meetEvents).values({
    id,
    meetId,
    eventNumber: event.eventNumber,
    stroke: event.stroke,
    distance: event.distance,
    gender,
    ageGroup: event.ageGroup,
    eventKey: event.eventKey,
    qualifyingTimeMs: event.qualifyingTimeMs ?? null,
  });
  return id;
}

export async function addMeetEntry(
  meetId: string,
  meetEventId: string,
  membershipId: string,
  seedTimeMs?: number | null,
  entryNotes?: string,
  status: "draft" | "approved" | "scratched" = "draft",
  seedTimeSource?: SeedTimeSource,
) {
  const source: SeedTimeSource =
    seedTimeSource ??
    (seedTimeMs != null && seedTimeMs > 0 ? "personal_best" : "no_time");
  const id = generateId();
  await db.insert(meetEntries).values({
    id,
    meetId,
    meetEventId,
    membershipId,
    seedTimeMs: seedTimeMs ?? null,
    seedTimeSource: source,
    entryNotes: entryNotes ?? null,
    status,
  });
  return id;
}

export async function upsertMeetCommitment(
  meetId: string,
  membershipId: string,
  status: "pending" | "committed" | "declined",
  notes?: string,
) {
  const [existing] = await db
    .select()
    .from(meetCommitments)
    .where(
      and(
        eq(meetCommitments.meetId, meetId),
        eq(meetCommitments.membershipId, membershipId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(meetCommitments)
      .set({
        status,
        notes: notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(meetCommitments.id, existing.id));
    return existing.id;
  }

  const id = generateId();
  await db.insert(meetCommitments).values({
    id,
    meetId,
    membershipId,
    status,
    notes: notes ?? null,
  });
  return id;
}

export async function getMeetCommitments(meetId: string) {
  return db
    .select({
      id: meetCommitments.id,
      membershipId: meetCommitments.membershipId,
      status: meetCommitments.status,
      notes: meetCommitments.notes,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      practiceGroup: teamSwimmerMemberships.practiceGroup,
    })
    .from(meetCommitments)
    .innerJoin(
      teamSwimmerMemberships,
      eq(meetCommitments.membershipId, teamSwimmerMemberships.id),
    )
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(eq(meetCommitments.meetId, meetId));
}

export async function getMeetEntriesDetailed(meetId: string) {
  return db
    .select({
      id: meetEntries.id,
      meetEventId: meetEntries.meetEventId,
      membershipId: meetEntries.membershipId,
      seedTimeMs: meetEntries.seedTimeMs,
      entryNotes: meetEntries.entryNotes,
      status: meetEntries.status,
      eventNumber: meetEvents.eventNumber,
      distance: meetEvents.distance,
      stroke: meetEvents.stroke,
      gender: meetEvents.gender,
      eventKey: meetEvents.eventKey,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      swimmerId: swimmers.id,
    })
    .from(meetEntries)
    .innerJoin(meetEvents, eq(meetEntries.meetEventId, meetEvents.id))
    .innerJoin(
      teamSwimmerMemberships,
      eq(meetEntries.membershipId, teamSwimmerMemberships.id),
    )
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(eq(meetEntries.meetId, meetId));
}

export async function updateMeetEntryStatus(
  entryId: string,
  status: "draft" | "approved" | "scratched",
) {
  await db
    .update(meetEntries)
    .set({ status, updatedAt: new Date() })
    .where(eq(meetEntries.id, entryId));
}

export async function deleteMeetEntry(entryId: string) {
  await db.delete(meetEntries).where(eq(meetEntries.id, entryId));
}

/** Deletes a meet owned by the organization. Cascades events/entries/results. */
export async function deleteMeet(meetId: string, organizationId: string) {
  const meet = await getMeetById(meetId, organizationId);
  if (!meet) return false;

  await db.delete(meets).where(eq(meets.id, meetId));
  return true;
}

export async function addMeetResult(
  meetId: string,
  meetEventId: string,
  swimmerId: string,
  timeMs: number,
  options?: {
    place?: number;
    isDq?: boolean;
    previousBestTimeMs?: number | null;
  },
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

  let previousBestTimeMs: number | null = null;
  if (options && "previousBestTimeMs" in options) {
    previousBestTimeMs = options.previousBestTimeMs ?? null;
  } else if (event[0]) {
    previousBestTimeMs = await getBestTimeMs(
      swimmerId,
      event[0].eventKey,
      course,
    );
  }

  await db.insert(meetResults).values({
    id,
    meetId,
    meetEventId,
    swimmerId,
    timeMs,
    previousBestTimeMs,
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

export async function getBestTimeMs(
  swimmerId: string,
  eventKey: string,
  course: "SCY" | "SCM" | "LCM",
): Promise<number | null> {
  const [best] = await db
    .select({ timeMs: swimmerBestTimes.timeMs })
    .from(swimmerBestTimes)
    .where(
      and(
        eq(swimmerBestTimes.swimmerId, swimmerId),
        eq(swimmerBestTimes.eventKey, eventKey),
        eq(swimmerBestTimes.course, course),
      ),
    )
    .limit(1);
  return best?.timeMs ?? null;
}

export async function getMeetResults(meetId: string) {
  return db.select().from(meetResults).where(eq(meetResults.meetId, meetId));
}

export async function getMeetResultsDetailed(meetId: string) {
  return db
    .select({
      id: meetResults.id,
      meetEventId: meetResults.meetEventId,
      swimmerId: meetResults.swimmerId,
      timeMs: meetResults.timeMs,
      previousBestTimeMs: meetResults.previousBestTimeMs,
      place: meetResults.place,
      isDq: meetResults.isDq,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      dateOfBirth: swimmers.dateOfBirth,
      eventNumber: meetEvents.eventNumber,
      distance: meetEvents.distance,
      stroke: meetEvents.stroke,
      gender: meetEvents.gender,
      ageGroup: meetEvents.ageGroup,
      eventKey: meetEvents.eventKey,
    })
    .from(meetResults)
    .innerJoin(swimmers, eq(meetResults.swimmerId, swimmers.id))
    .innerJoin(meetEvents, eq(meetResults.meetEventId, meetEvents.id))
    .where(eq(meetResults.meetId, meetId))
    .orderBy(asc(meetEvents.eventNumber), asc(meetResults.place));
}

export async function getRosterBestTimesForEvents(
  organizationId: string,
  eventKeys: string[],
) {
  if (eventKeys.length === 0) return [];

  return db
    .select({
      membershipId: teamSwimmerMemberships.id,
      swimmerId: swimmers.id,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
      eventKey: swimmerBestTimes.eventKey,
      course: swimmerBestTimes.course,
      timeMs: swimmerBestTimes.timeMs,
    })
    .from(teamSwimmerMemberships)
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .innerJoin(swimmerBestTimes, eq(swimmerBestTimes.swimmerId, swimmers.id))
    .where(
      and(
        eq(teamSwimmerMemberships.organizationId, organizationId),
        eq(teamSwimmerMemberships.status, "active"),
        inArray(swimmerBestTimes.eventKey, eventKeys),
      ),
    );
}

export async function replaceMeetRelayLegs(input: {
  meetId: string;
  meetEventId: string;
  legs: Array<{
    membershipId: string;
    legOrder: number;
    stroke?: string;
    reasoning?: string;
  }>;
}) {
  await db
    .delete(meetRelayLegs)
    .where(
      and(
        eq(meetRelayLegs.meetId, input.meetId),
        eq(meetRelayLegs.meetEventId, input.meetEventId),
      ),
    );
  if (input.legs.length === 0) return;
  await db.insert(meetRelayLegs).values(
    input.legs.map((leg) => ({
      id: generateId(),
      meetId: input.meetId,
      meetEventId: input.meetEventId,
      legOrder: leg.legOrder,
      membershipId: leg.membershipId,
      stroke: leg.stroke ?? null,
      reasoning: leg.reasoning ?? null,
    })),
  );
}

export async function getMeetRelayLegs(meetId: string) {
  return db
    .select()
    .from(meetRelayLegs)
    .where(eq(meetRelayLegs.meetId, meetId))
    .orderBy(asc(meetRelayLegs.legOrder));
}
