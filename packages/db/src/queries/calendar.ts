import { formatDateOnly } from "@project-aqua/swim-core/calendar-date";
import { MAX_BULK_CALENDAR_EVENTS } from "@project-aqua/swim-core/calendar-recurrence";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { db } from "../client";
import {
  calendarConnections,
  calendarEventLinks,
  calendarFeedTokens,
  calendarSyncConflicts,
  teamCalendarEvents,
} from "../schema/calendar";
import { getPracticeSessions } from "./attendance";
import { getMeets } from "./meets";

function generateId(): string {
  return crypto.randomUUID();
}

function localDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type CalendarEventInput = {
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt?: Date;
  eventType?: "practice" | "meet" | "other";
  practiceSessionId?: string;
  meetId?: string;
  createdByUserId?: string;
};

export async function createCalendarEvent(
  organizationId: string,
  data: CalendarEventInput,
) {
  const id = generateId();
  await db.insert(teamCalendarEvents).values({
    id,
    organizationId,
    title: data.title,
    description: data.description ?? null,
    location: data.location ?? null,
    startsAt: data.startsAt,
    endsAt: data.endsAt ?? null,
    eventType: data.eventType ?? "other",
    practiceSessionId: data.practiceSessionId ?? null,
    meetId: data.meetId ?? null,
    createdByUserId: data.createdByUserId ?? null,
  });
  return id;
}

export async function createCalendarEventsBulk(
  organizationId: string,
  events: CalendarEventInput[],
) {
  if (events.length === 0) return [] as string[];
  if (events.length > MAX_BULK_CALENDAR_EVENTS) {
    throw new Error(
      `Cannot create more than ${MAX_BULK_CALENDAR_EVENTS} events at once`,
    );
  }

  const rows = events.map((data) => {
    const id = generateId();
    return {
      id,
      organizationId,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? null,
      eventType: data.eventType ?? "other",
      practiceSessionId: data.practiceSessionId ?? null,
      meetId: data.meetId ?? null,
      createdByUserId: data.createdByUserId ?? null,
    };
  });

  await db.insert(teamCalendarEvents).values(rows);
  return rows.map((row) => row.id);
}

export async function updateCalendarEvent(
  eventId: string,
  organizationId: string,
  data: Partial<
    Omit<CalendarEventInput, "endsAt" | "location" | "description">
  > & {
    endsAt?: Date | null;
    location?: string | null;
    description?: string | null;
  },
) {
  const [existing] = await db
    .select()
    .from(teamCalendarEvents)
    .where(
      and(
        eq(teamCalendarEvents.id, eventId),
        eq(teamCalendarEvents.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!existing) return null;

  await db
    .update(teamCalendarEvents)
    .set({
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && {
        description: data.description ?? null,
      }),
      ...(data.location !== undefined && { location: data.location ?? null }),
      ...(data.startsAt !== undefined && { startsAt: data.startsAt }),
      ...(data.endsAt !== undefined && { endsAt: data.endsAt ?? null }),
      ...(data.eventType !== undefined && { eventType: data.eventType }),
      aquaVersion: existing.aquaVersion + 1,
      updatedAt: new Date(),
    })
    .where(eq(teamCalendarEvents.id, eventId));

  return getCalendarEvent(eventId, organizationId);
}

export async function deleteCalendarEvent(
  eventId: string,
  organizationId: string,
) {
  await db
    .delete(teamCalendarEvents)
    .where(
      and(
        eq(teamCalendarEvents.id, eventId),
        eq(teamCalendarEvents.organizationId, organizationId),
      ),
    );
}

export async function getCalendarEvent(
  eventId: string,
  organizationId: string,
) {
  const [row] = await db
    .select()
    .from(teamCalendarEvents)
    .where(
      and(
        eq(teamCalendarEvents.id, eventId),
        eq(teamCalendarEvents.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listCalendarEvents(
  organizationId: string,
  range?: { from: Date; to: Date },
) {
  const conditions = [eq(teamCalendarEvents.organizationId, organizationId)];
  if (range) {
    conditions.push(gte(teamCalendarEvents.startsAt, range.from));
    conditions.push(lte(teamCalendarEvents.startsAt, range.to));
  }
  return db
    .select()
    .from(teamCalendarEvents)
    .where(and(...conditions))
    .orderBy(asc(teamCalendarEvents.startsAt));
}

/** Project practices + meets + custom events into a unified calendar list. */
export async function getTeamCalendarProjection(
  organizationId: string,
  range: { from: Date; to: Date },
) {
  const [custom, practices, meets] = await Promise.all([
    listCalendarEvents(organizationId, range),
    getPracticeSessions(organizationId),
    getMeets(organizationId),
  ]);

  const projected = [
    ...custom.map((e) => ({
      id: e.id,
      source: "custom" as const,
      title: e.title,
      location: e.location,
      description: e.description,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      eventType: e.eventType,
      meetId: e.meetId,
      practiceSessionId: e.practiceSessionId,
      aquaVersion: e.aquaVersion,
    })),
    ...practices
      .filter((p) => p.date >= range.from && p.date <= range.to)
      .filter((p) => !custom.some((c) => c.practiceSessionId === p.id))
      .map((p) => ({
        id: `practice:${p.id}`,
        source: "practice" as const,
        title: "Practice",
        location: p.location,
        description: p.notes,
        startsAt: p.date,
        endsAt: null as Date | null,
        eventType: "practice" as const,
        meetId: null as string | null,
        practiceSessionId: p.id,
        aquaVersion: 1,
      })),
    ...meets
      .filter((m) => {
        const key = formatDateOnly(m.startDate);
        return (
          key >= localDateOnly(range.from) && key <= localDateOnly(range.to)
        );
      })
      .filter((m) => !custom.some((c) => c.meetId === m.id))
      .map((m) => ({
        id: `meet:${m.id}`,
        source: "meet" as const,
        title: m.name,
        location: m.location,
        description: m.opponents,
        startsAt: m.startDate,
        endsAt: m.endDate,
        eventType: "meet" as const,
        meetId: m.id,
        practiceSessionId: null as string | null,
        aquaVersion: 1,
      })),
  ];

  return projected.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export async function createFeedToken(
  organizationId: string,
  createdByUserId?: string,
  label?: string,
) {
  const id = generateId();
  const token =
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "");
  await db.insert(calendarFeedTokens).values({
    id,
    organizationId,
    token,
    label: label ?? "Team calendar",
    createdByUserId: createdByUserId ?? null,
  });
  return { id, token };
}

export async function getActiveFeedToken(organizationId: string) {
  const [row] = await db
    .select()
    .from(calendarFeedTokens)
    .where(
      and(
        eq(calendarFeedTokens.organizationId, organizationId),
        isNull(calendarFeedTokens.revokedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getFeedTokenByValue(token: string) {
  const [row] = await db
    .select()
    .from(calendarFeedTokens)
    .where(
      and(
        eq(calendarFeedTokens.token, token),
        isNull(calendarFeedTokens.revokedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function revokeFeedTokens(organizationId: string) {
  await db
    .update(calendarFeedTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(calendarFeedTokens.organizationId, organizationId),
        isNull(calendarFeedTokens.revokedAt),
      ),
    );
}

export async function upsertCalendarConnection(data: {
  organizationId: string;
  userId: string;
  provider: "google" | "microsoft";
  externalCalendarId: string;
  externalCalendarName?: string;
}) {
  const existing = await db
    .select()
    .from(calendarConnections)
    .where(
      and(
        eq(calendarConnections.organizationId, data.organizationId),
        eq(calendarConnections.userId, data.userId),
        eq(calendarConnections.provider, data.provider),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(calendarConnections)
      .set({
        externalCalendarId: data.externalCalendarId,
        externalCalendarName: data.externalCalendarName ?? null,
        status: "active",
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(calendarConnections.id, existing[0].id));
    return existing[0].id;
  }

  const id = generateId();
  await db.insert(calendarConnections).values({
    id,
    organizationId: data.organizationId,
    userId: data.userId,
    provider: data.provider,
    externalCalendarId: data.externalCalendarId,
    externalCalendarName: data.externalCalendarName ?? null,
  });
  return id;
}

export async function getCalendarConnections(
  organizationId: string,
  userId?: string,
) {
  if (userId) {
    return db
      .select()
      .from(calendarConnections)
      .where(
        and(
          eq(calendarConnections.organizationId, organizationId),
          eq(calendarConnections.userId, userId),
        ),
      );
  }
  return db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.organizationId, organizationId));
}

export async function getCalendarConnectionById(connectionId: string) {
  const [row] = await db
    .select()
    .from(calendarConnections)
    .where(eq(calendarConnections.id, connectionId))
    .limit(1);
  return row ?? null;
}

export async function updateCalendarConnection(
  connectionId: string,
  data: Partial<{
    syncToken: string | null;
    channelId: string | null;
    resourceId: string | null;
    channelExpiresAt: Date | null;
    lastSyncedAt: Date | null;
    lastError: string | null;
    status: "active" | "error" | "disconnected";
  }>,
) {
  await db
    .update(calendarConnections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(calendarConnections.id, connectionId));
}

export async function disconnectCalendarConnection(connectionId: string) {
  await updateCalendarConnection(connectionId, {
    status: "disconnected",
    syncToken: null,
    channelId: null,
    resourceId: null,
  });
}

export async function upsertEventLink(data: {
  aquaEventId: string;
  connectionId: string;
  provider: "google" | "microsoft";
  externalCalendarId: string;
  externalEventId: string;
  externalEtag?: string;
  aquaVersionAtSync: number;
  direction: "push" | "pull";
}) {
  const existing = await db
    .select()
    .from(calendarEventLinks)
    .where(
      and(
        eq(calendarEventLinks.connectionId, data.connectionId),
        eq(calendarEventLinks.externalEventId, data.externalEventId),
      ),
    )
    .limit(1);

  const stamp =
    data.direction === "push"
      ? { lastPushedAt: new Date() }
      : { lastPulledAt: new Date() };

  if (existing[0]) {
    await db
      .update(calendarEventLinks)
      .set({
        aquaEventId: data.aquaEventId,
        externalEtag: data.externalEtag ?? null,
        aquaVersionAtSync: data.aquaVersionAtSync,
        updatedAt: new Date(),
        ...stamp,
      })
      .where(eq(calendarEventLinks.id, existing[0].id));
    return existing[0].id;
  }

  const id = generateId();
  await db.insert(calendarEventLinks).values({
    id,
    aquaEventId: data.aquaEventId,
    connectionId: data.connectionId,
    provider: data.provider,
    externalCalendarId: data.externalCalendarId,
    externalEventId: data.externalEventId,
    externalEtag: data.externalEtag ?? null,
    aquaVersionAtSync: data.aquaVersionAtSync,
    ...stamp,
  });
  return id;
}

export async function getEventLinksForAquaEvent(aquaEventId: string) {
  return db
    .select()
    .from(calendarEventLinks)
    .where(eq(calendarEventLinks.aquaEventId, aquaEventId));
}

export async function getEventLinkByExternal(
  connectionId: string,
  externalEventId: string,
) {
  const [row] = await db
    .select()
    .from(calendarEventLinks)
    .where(
      and(
        eq(calendarEventLinks.connectionId, connectionId),
        eq(calendarEventLinks.externalEventId, externalEventId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function recordSyncConflict(data: {
  organizationId: string;
  aquaEventId?: string;
  connectionId?: string;
  provider: "google" | "microsoft";
  externalEventId?: string;
  details?: Record<string, unknown>;
}) {
  const id = generateId();
  await db.insert(calendarSyncConflicts).values({
    id,
    organizationId: data.organizationId,
    aquaEventId: data.aquaEventId ?? null,
    connectionId: data.connectionId ?? null,
    provider: data.provider,
    externalEventId: data.externalEventId ?? null,
    resolution: "aqua_wins",
    details: data.details ?? null,
  });
  return id;
}

export async function getRecentSyncConflicts(
  organizationId: string,
  limit = 10,
) {
  return db
    .select()
    .from(calendarSyncConflicts)
    .where(eq(calendarSyncConflicts.organizationId, organizationId))
    .orderBy(desc(calendarSyncConflicts.createdAt))
    .limit(limit);
}
