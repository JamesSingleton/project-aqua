import type { ExternalCalendarEvent } from "./tokens";
import { getProviderTokens } from "./tokens";

const GRAPH = "https://graph.microsoft.com/v1.0";

async function graphFetch(userId: string, path: string, init?: RequestInit) {
  const tokens = await getProviderTokens(userId, "microsoft");
  const res = await fetch(`${GRAPH}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Microsoft Graph error ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function ensureMicrosoftTeamCalendar(
  userId: string,
  teamName: string,
) {
  const name = `Project Aqua – ${teamName}`;
  const list = await graphFetch(userId, "/me/calendars");
  const existing = (list?.value ?? []).find(
    (c: { name?: string }) => c.name === name,
  );
  if (existing?.id) {
    return { id: existing.id as string, name };
  }
  const created = await graphFetch(userId, "/me/calendars", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { id: created.id as string, name };
}

export async function upsertMicrosoftEvent(
  userId: string,
  calendarId: string,
  event: {
    externalEventId?: string;
    title: string;
    description?: string;
    location?: string;
    startsAt: Date;
    endsAt?: Date;
  },
): Promise<ExternalCalendarEvent> {
  const body = {
    subject: event.title,
    body: {
      contentType: "text",
      content: event.description ?? "",
    },
    location: event.location ? { displayName: event.location } : undefined,
    start: {
      dateTime: event.startsAt.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: (
        event.endsAt ?? new Date(event.startsAt.getTime() + 3600000)
      ).toISOString(),
      timeZone: "UTC",
    },
  };

  const data = event.externalEventId
    ? await graphFetch(
        userId,
        `/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(event.externalEventId)}`,
        { method: "PATCH", body: JSON.stringify(body) },
      )
    : await graphFetch(
        userId,
        `/me/calendars/${encodeURIComponent(calendarId)}/events`,
        { method: "POST", body: JSON.stringify(body) },
      );

  return {
    id: data.id,
    etag: data["@odata.etag"],
    title: data.subject ?? event.title,
    description: data.body?.content,
    location: data.location?.displayName,
    startsAt: data.start?.dateTime,
    endsAt: data.end?.dateTime,
  };
}

export async function deleteMicrosoftEvent(
  userId: string,
  calendarId: string,
  externalEventId: string,
) {
  try {
    await graphFetch(
      userId,
      `/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalEventId)}`,
      { method: "DELETE" },
    );
  } catch {
    // ignore missing
  }
}

export async function listMicrosoftEvents(
  userId: string,
  calendarId: string,
  deltaLink?: string | null,
): Promise<{ events: ExternalCalendarEvent[]; nextSyncToken?: string }> {
  const path =
    deltaLink ?? `/me/calendars/${encodeURIComponent(calendarId)}/events/delta`;

  const data = deltaLink
    ? await graphFetch(userId, deltaLink.replace(GRAPH, ""))
    : await graphFetch(userId, path);

  return {
    events: (data.value ?? []).map(
      (item: {
        id: string;
        "@odata.etag"?: string;
        subject?: string;
        body?: { content?: string };
        location?: { displayName?: string };
        start?: { dateTime?: string };
        end?: { dateTime?: string };
        isCancelled?: boolean;
      }) => ({
        id: item.id,
        etag: item["@odata.etag"],
        title: item.subject ?? "(untitled)",
        description: item.body?.content,
        location: item.location?.displayName,
        startsAt: item.start?.dateTime ?? new Date().toISOString(),
        endsAt: item.end?.dateTime,
        status: item.isCancelled ? "cancelled" : "confirmed",
      }),
    ),
    nextSyncToken: data["@odata.deltaLink"] ?? data["@odata.nextLink"],
  };
}

export async function subscribeMicrosoftCalendar(
  userId: string,
  calendarId: string,
  webhookUrl: string,
  clientState: string,
) {
  const expiration = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const data = await graphFetch(userId, "/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      changeType: "created,updated,deleted",
      notificationUrl: webhookUrl,
      resource: `/me/calendars/${calendarId}/events`,
      expirationDateTime: expiration.toISOString(),
      clientState,
    }),
  });
  return {
    subscriptionId: data.id as string,
    expiration,
  };
}
