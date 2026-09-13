import type { ExternalCalendarEvent } from "./tokens";
import { getProviderTokens } from "./tokens";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

async function googleFetch(userId: string, path: string, init?: RequestInit) {
  const tokens = await getProviderTokens(userId, "google");
  const res = await fetch(`${GOOGLE_CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Calendar API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function ensureGoogleTeamCalendar(
  userId: string,
  teamName: string,
) {
  const summary = `Project Aqua – ${teamName}`;
  const list = await googleFetch(userId, "/users/me/calendarList");
  const existing = (list?.items ?? []).find(
    (c: { summary?: string }) => c.summary === summary,
  );
  if (existing?.id) {
    return { id: existing.id as string, name: summary };
  }

  const created = await googleFetch(userId, "/calendars", {
    method: "POST",
    body: JSON.stringify({ summary, description: "Synced from Project Aqua" }),
  });
  return { id: created.id as string, name: summary };
}

export async function upsertGoogleEvent(
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
    summary: event.title,
    description: event.description,
    location: event.location,
    start: { dateTime: event.startsAt.toISOString() },
    end: {
      dateTime: (
        event.endsAt ?? new Date(event.startsAt.getTime() + 3600000)
      ).toISOString(),
    },
  };

  const encodedCalendar = encodeURIComponent(calendarId);
  const data = event.externalEventId
    ? await googleFetch(
        userId,
        `/calendars/${encodedCalendar}/events/${encodeURIComponent(event.externalEventId)}`,
        { method: "PUT", body: JSON.stringify(body) },
      )
    : await googleFetch(userId, `/calendars/${encodedCalendar}/events`, {
        method: "POST",
        body: JSON.stringify(body),
      });

  return {
    id: data.id,
    etag: data.etag,
    title: data.summary ?? event.title,
    description: data.description,
    location: data.location,
    startsAt: data.start?.dateTime ?? data.start?.date,
    endsAt: data.end?.dateTime ?? data.end?.date,
    status: data.status,
  };
}

export async function deleteGoogleEvent(
  userId: string,
  calendarId: string,
  externalEventId: string,
) {
  try {
    await googleFetch(
      userId,
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalEventId)}`,
      { method: "DELETE" },
    );
  } catch {
    // Event may already be gone
  }
}

export async function listGoogleEvents(
  userId: string,
  calendarId: string,
  syncToken?: string | null,
): Promise<{ events: ExternalCalendarEvent[]; nextSyncToken?: string }> {
  const encoded = encodeURIComponent(calendarId);
  const params = new URLSearchParams({ singleEvents: "true" });
  if (syncToken) params.set("syncToken", syncToken);
  else {
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    params.set("timeMin", from.toISOString());
  }

  try {
    const data = await googleFetch(
      userId,
      `/calendars/${encoded}/events?${params.toString()}`,
    );
    return {
      events: (data.items ?? []).map(
        (item: {
          id: string;
          etag?: string;
          summary?: string;
          description?: string;
          location?: string;
          start?: { dateTime?: string; date?: string };
          end?: { dateTime?: string; date?: string };
          status?: string;
        }) => ({
          id: item.id,
          etag: item.etag,
          title: item.summary ?? "(untitled)",
          description: item.description,
          location: item.location,
          startsAt:
            item.start?.dateTime ??
            item.start?.date ??
            new Date().toISOString(),
          endsAt: item.end?.dateTime ?? item.end?.date,
          status: item.status,
        }),
      ),
      nextSyncToken: data.nextSyncToken,
    };
  } catch (error) {
    // 410 Gone means sync token expired — retry without it
    if (error instanceof Error && error.message.includes("410")) {
      return listGoogleEvents(userId, calendarId, null);
    }
    throw error;
  }
}

export async function watchGoogleCalendar(
  userId: string,
  calendarId: string,
  channelId: string,
  webhookUrl: string,
) {
  const data = await googleFetch(
    userId,
    `/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: webhookUrl,
      }),
    },
  );
  return {
    resourceId: data.resourceId as string,
    expiration: data.expiration ? new Date(Number(data.expiration)) : null,
  };
}
