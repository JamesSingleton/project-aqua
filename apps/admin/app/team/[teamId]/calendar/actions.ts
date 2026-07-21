"use server";

import { getSession } from "@project-aqua/auth/session";
import {
  ensureGoogleTeamCalendar,
  watchGoogleCalendar,
} from "@project-aqua/calendar-sync/google";
import {
  ensureMicrosoftTeamCalendar,
  subscribeMicrosoftCalendar,
} from "@project-aqua/calendar-sync/microsoft";
import {
  deleteAquaEventFromConnection,
  pullConnectionChanges,
  pushAllEventsToConnection,
  pushAquaEventToConnection,
} from "@project-aqua/calendar-sync/sync";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import {
  createCalendarEvent,
  createCalendarEventsBulk,
  createFeedToken,
  deleteCalendarEvent,
  disconnectCalendarConnection,
  getActiveFeedToken,
  getCalendarConnections,
  getRecentSyncConflicts,
  getTeamCalendarProjection,
  revokeFeedTokens,
  updateCalendarEvent,
  upsertCalendarConnection,
} from "@project-aqua/db/queries/calendar";
import { organization } from "@project-aqua/db/schema";
import {
  expandWeeklyCalendarSlots,
  type RecurringCalendarScheduleInput,
} from "@project-aqua/swim-core/calendar-recurrence";
import { normalizeOptionalText } from "@project-aqua/swim-core/text";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

const MAX_LOCATION_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TITLE_LENGTH = 200;

function normalizeRequiredTitle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Title is required");
  if (trimmed.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  return trimmed;
}

function monthRange(anchor: Date) {
  const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const to = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
    23,
    59,
    59,
  );
  return { from, to };
}

export async function getCalendarEventsAction(
  teamId: string,
  year: number,
  month: number,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);
  const anchor = new Date(year, month, 1);
  return getTeamCalendarProjection(teamId, monthRange(anchor));
}

export async function createCalendarEventAction(
  teamId: string,
  data: {
    title: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    description?: string;
    eventType?: "practice" | "meet" | "other";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const id = await createCalendarEvent(teamId, {
    title: normalizeRequiredTitle(data.title),
    startsAt: new Date(data.startsAt),
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
    location:
      normalizeOptionalText(data.location, MAX_LOCATION_LENGTH) ?? undefined,
    description:
      normalizeOptionalText(data.description, MAX_DESCRIPTION_LENGTH) ??
      undefined,
    eventType: data.eventType ?? "other",
    createdByUserId: session?.user?.id,
  });

  after(async () => {
    const connections = await getCalendarConnections(teamId);
    for (const connection of connections.filter((c) => c.status === "active")) {
      try {
        await pushAquaEventToConnection(connection.id, id);
      } catch {
        // best-effort outbound sync
      }
    }
  });

  revalidatePath(`/team/${teamId}/calendar`);
  return id;
}

export async function createRecurringCalendarEventsAction(
  teamId: string,
  data: {
    title: string;
    location?: string;
    description?: string;
    eventType?: "practice" | "meet" | "other";
    rangeStart: string;
    rangeEnd: string;
    slots: Array<{
      weekdays: number[];
      startTime: string;
      endTime: string;
    }>;
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const location = normalizeOptionalText(data.location, MAX_LOCATION_LENGTH);
  const description = normalizeOptionalText(
    data.description,
    MAX_DESCRIPTION_LENGTH,
  );

  const schedule: RecurringCalendarScheduleInput = {
    title: normalizeRequiredTitle(data.title),
    location: location ?? undefined,
    description: description ?? undefined,
    eventType: data.eventType ?? "practice",
    rangeStart: data.rangeStart,
    rangeEnd: data.rangeEnd,
    slots: data.slots,
    createdByUserId: session?.user?.id,
  };

  const expanded = expandWeeklyCalendarSlots(schedule);
  const ids = await createCalendarEventsBulk(teamId, expanded);

  after(async () => {
    const connections = await getCalendarConnections(teamId);
    const active = connections.filter((c) => c.status === "active");
    for (const id of ids) {
      for (const connection of active) {
        try {
          await pushAquaEventToConnection(connection.id, id);
        } catch {
          // best-effort outbound sync
        }
      }
    }
  });

  revalidatePath(`/team/${teamId}/calendar`);
  return { count: ids.length, ids };
}

export async function updateCalendarEventAction(
  teamId: string,
  eventId: string,
  data: {
    title?: string;
    startsAt?: string;
    endsAt?: string | null;
    location?: string | null;
    description?: string | null;
    eventType?: "practice" | "meet" | "other";
  },
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  await updateCalendarEvent(eventId, teamId, {
    title:
      data.title === undefined ? undefined : normalizeRequiredTitle(data.title),
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt:
      data.endsAt === undefined
        ? undefined
        : data.endsAt
          ? new Date(data.endsAt)
          : null,
    location:
      data.location === undefined
        ? undefined
        : normalizeOptionalText(data.location, MAX_LOCATION_LENGTH),
    description:
      data.description === undefined
        ? undefined
        : normalizeOptionalText(data.description, MAX_DESCRIPTION_LENGTH),
    eventType: data.eventType,
  });

  after(async () => {
    const connections = await getCalendarConnections(teamId);
    for (const connection of connections.filter((c) => c.status === "active")) {
      try {
        await pushAquaEventToConnection(connection.id, eventId);
      } catch {
        // ignore
      }
    }
  });

  revalidatePath(`/team/${teamId}/calendar`);
}

export async function deleteCalendarEventAction(
  teamId: string,
  eventId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  after(async () => {
    const connections = await getCalendarConnections(teamId);
    for (const connection of connections.filter((c) => c.status === "active")) {
      try {
        await deleteAquaEventFromConnection(connection.id, eventId);
      } catch {
        // ignore
      }
    }
  });

  await deleteCalendarEvent(eventId, teamId);
  revalidatePath(`/team/${teamId}/calendar`);
}

export async function ensureIcsFeedAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const existing = await getActiveFeedToken(teamId);
  if (existing) return existing.token;

  const created = await createFeedToken(teamId, session?.user?.id);
  revalidatePath(`/team/${teamId}/calendar`);
  return created.token;
}

export async function rotateIcsFeedAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
  await revokeFeedTokens(teamId);
  const created = await createFeedToken(teamId, session?.user?.id);
  revalidatePath(`/team/${teamId}/calendar`);
  return created.token;
}

export async function getCalendarSettingsAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
    "admin",
    "member",
  ]);

  const [feed, connections, conflicts] = await Promise.all([
    getActiveFeedToken(teamId),
    session?.user?.id
      ? getCalendarConnections(teamId, session.user.id)
      : Promise.resolve([]),
    getRecentSyncConflicts(teamId),
  ]);

  return { feed, connections, conflicts };
}

export async function completeCalendarConnectAction(
  teamId: string,
  provider: "google" | "microsoft",
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await requireTeamRole(session.user.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);

  const [org] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const teamName = org?.name ?? "Team";
  const calendar =
    provider === "google"
      ? await ensureGoogleTeamCalendar(session.user.id, teamName)
      : await ensureMicrosoftTeamCalendar(session.user.id, teamName);

  const connectionId = await upsertCalendarConnection({
    organizationId: teamId,
    userId: session.user.id,
    provider,
    externalCalendarId: calendar.id,
    externalCalendarName: calendar.name,
  });

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

  try {
    if (provider === "google") {
      const channelId = crypto.randomUUID();
      const watch = await watchGoogleCalendar(
        session.user.id,
        calendar.id,
        channelId,
        `${baseUrl}/api/webhooks/google-calendar`,
      );
      const { updateCalendarConnection } = await import(
        "@project-aqua/db/queries/calendar"
      );
      await updateCalendarConnection(connectionId, {
        channelId,
        resourceId: watch.resourceId,
        channelExpiresAt: watch.expiration,
      });
    } else {
      const sub = await subscribeMicrosoftCalendar(
        session.user.id,
        calendar.id,
        `${baseUrl}/api/webhooks/microsoft-calendar`,
        connectionId,
      );
      const { updateCalendarConnection } = await import(
        "@project-aqua/db/queries/calendar"
      );
      await updateCalendarConnection(connectionId, {
        channelId: sub.subscriptionId,
        channelExpiresAt: sub.expiration,
      });
    }
  } catch {
    // Watch channels require publicly reachable URLs; connection still works via poll
  }

  after(async () => {
    try {
      await pushAllEventsToConnection(connectionId);
      await pullConnectionChanges(connectionId);
    } catch {
      // logged on connection
    }
  });

  revalidatePath(`/team/${teamId}/calendar`);
  return connectionId;
}

export async function syncCalendarNowAction(teamId: string) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  const connections = session?.user?.id
    ? await getCalendarConnections(teamId, session.user.id)
    : [];
  for (const connection of connections.filter((c) => c.status === "active")) {
    await pullConnectionChanges(connection.id);
    await pushAllEventsToConnection(connection.id);
  }
  revalidatePath(`/team/${teamId}/calendar`);
}

export async function disconnectCalendarAction(
  teamId: string,
  connectionId: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, [
    "owner",
    "head_coach",
    "assistant_coach",
  ]);
  await disconnectCalendarConnection(connectionId);
  revalidatePath(`/team/${teamId}/calendar`);
}
