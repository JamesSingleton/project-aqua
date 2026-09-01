import {
  normalizeMeetEndDate,
  parseDateOnly,
} from "@project-aqua/swim-core/calendar-date";
import {
  formatEventName,
  parseEventGender,
} from "@project-aqua/swim-core/events";
import type { CreateMeetInput } from "@project-aqua/swim-core/validators";
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../client";
import {
  type EntryLimitPackage,
  type MeetResultRound,
  meetCommitments,
  meetEntries,
  meetEvents,
  meetRelayLegs,
  meetResults,
  meets,
  organization,
  type SeedTimeSource,
  swimEvents,
  swimmerBestTimes,
  swimmers,
  teamSeasons,
  teamSwimmerMemberships,
} from "../schema/index";
import { findSwimmerBestTime, upsertBestTime } from "./progression";
import { ensureCurrentSeason } from "./seasons";

function generateId(): string {
  return crypto.randomUUID();
}

/** Meet dates are calendar days; store as UTC midnight. */
function toMeetDate(value: string): Date {
  const parsed = parseDateOnly(value.slice(0, 10));
  if (!parsed) {
    throw new Error(`Invalid meet date: ${value}`);
  }
  return parsed;
}

/** Optional calendar date; empty/null clears, undefined leaves unchanged. */
function toOptionalMeetDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === "") return null;
  return toMeetDate(value);
}

function toOptionalMeetEndDate(
  startDate: string,
  endDate: string | undefined,
): Date | null {
  const normalized = normalizeMeetEndDate(startDate, endDate);
  return normalized ? toMeetDate(normalized) : null;
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

export async function getMeets(
  organizationId: string,
  options?: { seasonId?: string },
) {
  const conditions = [eq(meets.organizationId, organizationId)];
  if (options?.seasonId) {
    conditions.push(eq(meets.seasonId, options.seasonId));
  }

  return db
    .select({
      id: meets.id,
      organizationId: meets.organizationId,
      seasonId: meets.seasonId,
      seasonLabel: teamSeasons.label,
      name: meets.name,
      startDate: meets.startDate,
      endDate: meets.endDate,
      entryDeadline: meets.entryDeadline,
      course: meets.course,
      location: meets.location,
      address: meets.address,
      importSource: meets.importSource,
      rawFilePath: meets.rawFilePath,
      maxIndividualEntries: meets.maxIndividualEntries,
      maxRelayEntries: meets.maxRelayEntries,
      maxCombinedEntries: meets.maxCombinedEntries,
      entryLimitPackages: meets.entryLimitPackages,
      entryLimitsSource: meets.entryLimitsSource,
      createdAt: meets.createdAt,
      updatedAt: meets.updatedAt,
    })
    .from(meets)
    .leftJoin(teamSeasons, eq(meets.seasonId, teamSeasons.id))
    .where(and(...conditions))
    .orderBy(desc(meets.startDate));
}

/** Upcoming meets for a coach who belongs to multiple teams. */
export async function getUpcomingMeetsForOrganizations(
  organizationIds: string[],
  from: Date,
  limit = 20,
) {
  if (organizationIds.length === 0) return [];

  return db
    .select({
      id: meets.id,
      organizationId: meets.organizationId,
      teamName: organization.name,
      name: meets.name,
      startDate: meets.startDate,
      location: meets.location,
    })
    .from(meets)
    .innerJoin(organization, eq(meets.organizationId, organization.id))
    .where(
      and(
        inArray(meets.organizationId, organizationIds),
        gte(meets.startDate, from),
      ),
    )
    .orderBy(asc(meets.startDate))
    .limit(limit);
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
    seasonId?: string;
    importSource?: string;
    maxIndividualEntries?: number | null;
    maxRelayEntries?: number | null;
    maxCombinedEntries?: number | null;
    entryLimitPackages?: EntryLimitPackage[] | null;
    entryLimitsSource?: string | null;
  },
) {
  const seasonId =
    data.seasonId ?? (await ensureCurrentSeason(organizationId)).id;
  const id = generateId();
  await db.insert(meets).values({
    id,
    organizationId,
    seasonId,
    name: data.name,
    startDate: toMeetDate(data.startDate),
    endDate: toOptionalMeetEndDate(data.startDate, data.endDate),
    entryDeadline: toOptionalMeetDate(data.entryDeadline) ?? null,
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
    seasonId?: string;
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
      startDate: toMeetDate(data.startDate),
      endDate: toOptionalMeetEndDate(data.startDate, data.endDate),
      ...(data.entryDeadline !== undefined
        ? { entryDeadline: toOptionalMeetDate(data.entryDeadline) ?? null }
        : {}),
      course: data.course,
      location: data.location ?? null,
      address: data.address ?? null,
      ...(data.seasonId !== undefined ? { seasonId: data.seasonId } : {}),
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
    eventKind?: "swim" | "dive";
    diveCount?: number | null;
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
    eventKind: event.eventKind ?? "swim",
    diveCount: event.diveCount ?? null,
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
  exhibition?: boolean,
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
    exhibition: exhibition ?? false,
  });
  return id;
}

export async function upsertMeetCommitment(
  meetId: string,
  membershipId: string,
  status: "pending" | "committed" | "declined" | "not_going" | "not_eligible",
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

export async function deleteMeetCommitment(
  meetId: string,
  membershipId: string,
) {
  await db
    .delete(meetCommitments)
    .where(
      and(
        eq(meetCommitments.meetId, meetId),
        eq(meetCommitments.membershipId, membershipId),
      ),
    );
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

/** Batch exclusion counts for dashboard meet cards. */
export async function getMeetCommitmentCounts(meetIds: string[]) {
  if (meetIds.length === 0) {
    return new Map<string, { notGoing: number; notEligible: number }>();
  }

  const rows = await db
    .select({
      meetId: meetCommitments.meetId,
      notGoing: sql<number>`count(*) filter (where ${meetCommitments.status} = 'not_going')::int`,
      notEligible: sql<number>`count(*) filter (where ${meetCommitments.status} = 'not_eligible')::int`,
    })
    .from(meetCommitments)
    .where(inArray(meetCommitments.meetId, meetIds))
    .groupBy(meetCommitments.meetId);

  return new Map(
    rows.map((row) => [
      row.meetId,
      {
        notGoing: Number(row.notGoing ?? 0),
        notEligible: Number(row.notEligible ?? 0),
      },
    ]),
  );
}

/** Entry fill progress for dashboard deadline cards. */
export async function getMeetEntryProgressCounts(meetIds: string[]) {
  if (meetIds.length === 0) {
    return new Map<string, { entryCount: number; athletesEntered: number }>();
  }

  const rows = await db
    .select({
      meetId: meetEntries.meetId,
      entryCount: sql<number>`count(*) filter (where ${meetEntries.status} <> 'scratched')::int`,
      athletesEntered: sql<number>`count(distinct ${meetEntries.membershipId}) filter (where ${meetEntries.status} <> 'scratched')::int`,
    })
    .from(meetEntries)
    .where(inArray(meetEntries.meetId, meetIds))
    .groupBy(meetEntries.meetId);

  return new Map(
    rows.map((row) => [
      row.meetId,
      {
        entryCount: Number(row.entryCount ?? 0),
        athletesEntered: Number(row.athletesEntered ?? 0),
      },
    ]),
  );
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
      seedTimeSource: meetEntries.seedTimeSource,
      exhibition: meetEntries.exhibition,
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

export async function updateMeetEntry(
  entryId: string,
  data: {
    seedTimeMs?: number | null;
    seedTimeSource?: SeedTimeSource;
    entryNotes?: string | null;
    exhibition?: boolean;
    status?: "draft" | "approved" | "scratched";
  },
) {
  await db
    .update(meetEntries)
    .set({
      ...(data.seedTimeMs !== undefined ? { seedTimeMs: data.seedTimeMs } : {}),
      ...(data.seedTimeSource !== undefined
        ? { seedTimeSource: data.seedTimeSource }
        : {}),
      ...(data.entryNotes !== undefined ? { entryNotes: data.entryNotes } : {}),
      ...(data.exhibition !== undefined ? { exhibition: data.exhibition } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedAt: new Date(),
    })
    .where(eq(meetEntries.id, entryId));
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
    splitTimes?: number[] | null;
    round?: MeetResultRound | null;
    heat?: number | null;
    lane?: number | null;
    exhibition?: boolean;
    dqCode?: string | null;
  },
) {
  const id = generateId();
  const [meet] = await db
    .select()
    .from(meets)
    .where(eq(meets.id, meetId))
    .limit(1);

  const [event] = await db
    .select({
      id: meetEvents.id,
      eventKey: meetEvents.eventKey,
      course: swimEvents.course,
    })
    .from(meetEvents)
    .leftJoin(swimEvents, eq(swimEvents.eventKey, meetEvents.eventKey))
    .where(eq(meetEvents.id, meetEventId))
    .limit(1);

  const course = event?.course ?? meet?.course ?? "SCY";

  let previousBestTimeMs: number | null = null;
  if (options && "previousBestTimeMs" in options) {
    previousBestTimeMs = options.previousBestTimeMs ?? null;
  } else if (event) {
    previousBestTimeMs = await getBestTimeMs(swimmerId, event.eventKey, course);
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
    splitTimes: options?.splitTimes ?? null,
    round: options?.round ?? null,
    heat: options?.heat ?? null,
    lane: options?.lane ?? null,
    exhibition: options?.exhibition ?? false,
    dqCode: options?.dqCode ?? null,
  });

  if (event && !options?.isDq && !options?.exhibition) {
    await upsertBestTime({
      swimmerId,
      eventKey: event.eventKey,
      course,
      timeMs,
      achievedAt: meet?.startDate ?? new Date(),
      meetId,
    });
  }

  return id;
}

export async function getBestTimeMs(
  swimmerId: string,
  eventKey: string,
  _course?: "SCY" | "SCM" | "LCM",
): Promise<number | null> {
  const best = await findSwimmerBestTime(swimmerId, eventKey);
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
      round: meetResults.round,
      heat: meetResults.heat,
      lane: meetResults.lane,
      exhibition: meetResults.exhibition,
      dqCode: meetResults.dqCode,
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
    relayLetter?: string;
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
      relayLetter: (leg.relayLetter ?? "A").trim().toUpperCase() || "A",
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
    .orderBy(asc(meetRelayLegs.relayLetter), asc(meetRelayLegs.legOrder));
}

export async function getMeetRelayLegsDetailed(meetId: string) {
  return db
    .select({
      meetEventId: meetRelayLegs.meetEventId,
      relayLetter: meetRelayLegs.relayLetter,
      legOrder: meetRelayLegs.legOrder,
      membershipId: meetRelayLegs.membershipId,
      firstName: swimmers.firstName,
      lastName: swimmers.lastName,
    })
    .from(meetRelayLegs)
    .innerJoin(
      teamSwimmerMemberships,
      eq(meetRelayLegs.membershipId, teamSwimmerMemberships.id),
    )
    .innerJoin(swimmers, eq(teamSwimmerMemberships.swimmerId, swimmers.id))
    .where(eq(meetRelayLegs.meetId, meetId))
    .orderBy(asc(meetRelayLegs.relayLetter), asc(meetRelayLegs.legOrder));
}

export async function getMeetEventById(eventId: string, meetId: string) {
  const [event] = await db
    .select()
    .from(meetEvents)
    .where(and(eq(meetEvents.id, eventId), eq(meetEvents.meetId, meetId)))
    .limit(1);
  return event ?? null;
}

export async function countMeetEntriesForEvent(meetEventId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meetEntries)
    .where(eq(meetEntries.meetEventId, meetEventId));
  return row?.count ?? 0;
}

export async function suggestMeetEventNumber(meetId: string): Promise<number> {
  const events = await getMeetEvents(meetId);
  const numbers = events
    .map((event) => event.eventNumber)
    .filter((n): n is number => n != null);
  if (numbers.length === 0) return 1;
  return Math.max(...numbers) + 1;
}

export async function updateMeetEvent(
  eventId: string,
  meetId: string,
  data: {
    eventNumber?: number | null;
    stroke?: string;
    distance?: number;
    gender?: string;
    ageGroup?: string | null;
    eventKey?: string;
    qualifyingTimeMs?: number | null;
  },
) {
  const patch: Record<string, unknown> = { ...data };
  if (data.gender) {
    patch.gender = parseEventGender(data.gender);
  }
  await db
    .update(meetEvents)
    .set(patch)
    .where(and(eq(meetEvents.id, eventId), eq(meetEvents.meetId, meetId)));
}

export async function deleteMeetEvent(eventId: string, meetId: string) {
  await db
    .delete(meetEvents)
    .where(and(eq(meetEvents.id, eventId), eq(meetEvents.meetId, meetId)));
}

export async function deleteMeetEntriesForEvent(meetEventId: string) {
  await db.delete(meetEntries).where(eq(meetEntries.meetEventId, meetEventId));
}

export async function deleteMeetRelayLegsForEvent(
  meetId: string,
  meetEventId: string,
) {
  await db
    .delete(meetRelayLegs)
    .where(
      and(
        eq(meetRelayLegs.meetId, meetId),
        eq(meetRelayLegs.meetEventId, meetEventId),
      ),
    );
}
