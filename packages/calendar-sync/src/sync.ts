import {
  createCalendarEvent,
  getCalendarConnectionById,
  getCalendarEvent,
  getEventLinkByExternal,
  getEventLinksForEvent,
  listCalendarEvents,
  recordSyncConflict,
  updateCalendarConnection,
  updateCalendarEvent,
  upsertEventLink,
} from "@lane4hq/db/queries/calendar";
import {
  deleteGoogleEvent,
  listGoogleEvents,
  upsertGoogleEvent,
} from "./google";
import {
  deleteMicrosoftEvent,
  listMicrosoftEvents,
  upsertMicrosoftEvent,
} from "./microsoft";

/** Push a single Lane4 HQ event to all active connections for the org (caller filters). */
export async function pushEventToConnection(
  connectionId: string,
  eventId: string,
) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection || connection.status !== "active") return;

  const event = await getCalendarEvent(eventId, connection.organizationId);
  if (!event) return;

  const links = await getEventLinksForEvent(eventId);
  const existing = links.find((l) => l.connectionId === connectionId);

  if (connection.provider === "google") {
    const external = await upsertGoogleEvent(
      connection.userId,
      connection.externalCalendarId,
      {
        externalEventId: existing?.externalEventId,
        title: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        startsAt: event.startsAt,
        endsAt: event.endsAt ?? undefined,
      },
    );
    await upsertEventLink({
      eventId,
      connectionId,
      provider: "google",
      externalCalendarId: connection.externalCalendarId,
      externalEventId: external.id,
      externalEtag: external.etag,
      eventVersionAtSync: event.version,
      direction: "push",
    });
    return;
  }

  const external = await upsertMicrosoftEvent(
    connection.userId,
    connection.externalCalendarId,
    {
      externalEventId: existing?.externalEventId,
      title: event.title,
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      startsAt: event.startsAt,
      endsAt: event.endsAt ?? undefined,
    },
  );
  await upsertEventLink({
    eventId,
    connectionId,
    provider: "microsoft",
    externalCalendarId: connection.externalCalendarId,
    externalEventId: external.id,
    externalEtag: external.etag,
    eventVersionAtSync: event.version,
    direction: "push",
  });
}

export async function deleteEventFromConnection(
  connectionId: string,
  eventId: string,
) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection) return;
  const links = await getEventLinksForEvent(eventId);
  const existing = links.find((l) => l.connectionId === connectionId);
  if (!existing) return;

  if (connection.provider === "google") {
    await deleteGoogleEvent(
      connection.userId,
      connection.externalCalendarId,
      existing.externalEventId,
    );
  } else {
    await deleteMicrosoftEvent(
      connection.userId,
      connection.externalCalendarId,
      existing.externalEventId,
    );
  }
}

/**
 * Pull remote changes. Lane4 HQ wins for mapped team events when both sides dirty.
 * Unmapped remote events on the dedicated calendar are pulled into Lane4 HQ as `other`.
 */
export async function pullConnectionChanges(connectionId: string) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection || connection.status !== "active") return;

  try {
    const listed =
      connection.provider === "google"
        ? await listGoogleEvents(
            connection.userId,
            connection.externalCalendarId,
            connection.syncToken,
          )
        : await listMicrosoftEvents(
            connection.userId,
            connection.externalCalendarId,
            connection.syncToken,
          );

    for (const remote of listed.events) {
      if (remote.status === "cancelled") {
        // Lane4 HQ remains source of truth — mapped events will be recreated on next push
        continue;
      }

      const link = await getEventLinkByExternal(connectionId, remote.id);
      if (link) {
        const local = await getCalendarEvent(
          link.eventId,
          connection.organizationId,
        );
        if (!local) continue;

        const localChanged = local.version > link.eventVersionAtSync;
        const remoteChanged =
          remote.etag && link.externalEtag && remote.etag !== link.externalEtag;

        if (localChanged && remoteChanged) {
          await recordSyncConflict({
            organizationId: connection.organizationId,
            eventId: local.id,
            connectionId,
            provider: connection.provider,
            externalEventId: remote.id,
            details: {
              message: "Both sides changed; Lane4 HQ version kept",
              localVersion: local.version,
              remoteEtag: remote.etag,
            },
          });
          // Re-push Lane4 HQ version
          await pushEventToConnection(connectionId, local.id);
          continue;
        }

        if (remoteChanged && !localChanged) {
          await updateCalendarEvent(local.id, connection.organizationId, {
            title: remote.title,
            description: remote.description,
            location: remote.location,
            startsAt: new Date(remote.startsAt),
            endsAt: remote.endsAt ? new Date(remote.endsAt) : undefined,
          });
          const updated = await getCalendarEvent(
            local.id,
            connection.organizationId,
          );
          await upsertEventLink({
            eventId: local.id,
            connectionId,
            provider: connection.provider,
            externalCalendarId: connection.externalCalendarId,
            externalEventId: remote.id,
            externalEtag: remote.etag,
            eventVersionAtSync: updated?.version ?? local.version,
            direction: "pull",
          });
        }
        continue;
      }

      // Unmapped remote event on dedicated calendar → create in Lane4 HQ
      const eventId = await createCalendarEvent(connection.organizationId, {
        title: remote.title,
        description: remote.description,
        location: remote.location,
        startsAt: new Date(remote.startsAt),
        endsAt: remote.endsAt ? new Date(remote.endsAt) : undefined,
        eventType: "other",
        createdByUserId: connection.userId,
      });
      await upsertEventLink({
        eventId,
        connectionId,
        provider: connection.provider,
        externalCalendarId: connection.externalCalendarId,
        externalEventId: remote.id,
        externalEtag: remote.etag,
        eventVersionAtSync: 1,
        direction: "pull",
      });
    }

    await updateCalendarConnection(connectionId, {
      syncToken: listed.nextSyncToken ?? connection.syncToken,
      lastSyncedAt: new Date(),
      lastError: null,
      status: "active",
    });
  } catch (error) {
    await updateCalendarConnection(connectionId, {
      status: "error",
      lastError: error instanceof Error ? error.message : "Sync failed",
    });
    throw error;
  }
}

export async function pushAllEventsToConnection(connectionId: string) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection) return;
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const to = new Date();
  to.setFullYear(to.getFullYear() + 2);
  const events = await listCalendarEvents(connection.organizationId, {
    from,
    to,
  });
  for (const event of events) {
    await pushEventToConnection(connectionId, event.id);
  }
}
