import {
  createCalendarEvent,
  getCalendarConnectionById,
  getCalendarEvent,
  getEventLinkByExternal,
  getEventLinksForAquaEvent,
  listCalendarEvents,
  recordSyncConflict,
  updateCalendarConnection,
  updateCalendarEvent,
  upsertEventLink,
} from "@project-aqua/db/queries/calendar";
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

/** Push a single Aqua event to all active connections for the org (caller filters). */
export async function pushAquaEventToConnection(
  connectionId: string,
  aquaEventId: string,
) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection || connection.status !== "active") return;

  const event = await getCalendarEvent(aquaEventId, connection.organizationId);
  if (!event) return;

  const links = await getEventLinksForAquaEvent(aquaEventId);
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
      aquaEventId,
      connectionId,
      provider: "google",
      externalCalendarId: connection.externalCalendarId,
      externalEventId: external.id,
      externalEtag: external.etag,
      aquaVersionAtSync: event.aquaVersion,
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
    aquaEventId,
    connectionId,
    provider: "microsoft",
    externalCalendarId: connection.externalCalendarId,
    externalEventId: external.id,
    externalEtag: external.etag,
    aquaVersionAtSync: event.aquaVersion,
    direction: "push",
  });
}

export async function deleteAquaEventFromConnection(
  connectionId: string,
  aquaEventId: string,
) {
  const connection = await getCalendarConnectionById(connectionId);
  if (!connection) return;
  const links = await getEventLinksForAquaEvent(aquaEventId);
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
 * Pull remote changes. Aqua-wins for mapped team events when both sides dirty.
 * Unmapped remote events on the dedicated calendar are pulled into Aqua as `other`.
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
        // Aqua remains source of truth — mapped events will be recreated on next push
        continue;
      }

      const link = await getEventLinkByExternal(connectionId, remote.id);
      if (link) {
        const aqua = await getCalendarEvent(
          link.aquaEventId,
          connection.organizationId,
        );
        if (!aqua) continue;

        const aquaChanged = aqua.aquaVersion > link.aquaVersionAtSync;
        const remoteChanged =
          remote.etag && link.externalEtag && remote.etag !== link.externalEtag;

        if (aquaChanged && remoteChanged) {
          await recordSyncConflict({
            organizationId: connection.organizationId,
            aquaEventId: aqua.id,
            connectionId,
            provider: connection.provider,
            externalEventId: remote.id,
            details: {
              message: "Both sides changed; Aqua version kept",
              aquaVersion: aqua.aquaVersion,
              remoteEtag: remote.etag,
            },
          });
          // Re-push Aqua version
          await pushAquaEventToConnection(connectionId, aqua.id);
          continue;
        }

        if (remoteChanged && !aquaChanged) {
          await updateCalendarEvent(aqua.id, connection.organizationId, {
            title: remote.title,
            description: remote.description,
            location: remote.location,
            startsAt: new Date(remote.startsAt),
            endsAt: remote.endsAt ? new Date(remote.endsAt) : undefined,
          });
          const updated = await getCalendarEvent(
            aqua.id,
            connection.organizationId,
          );
          await upsertEventLink({
            aquaEventId: aqua.id,
            connectionId,
            provider: connection.provider,
            externalCalendarId: connection.externalCalendarId,
            externalEventId: remote.id,
            externalEtag: remote.etag,
            aquaVersionAtSync: updated?.aquaVersion ?? aqua.aquaVersion,
            direction: "pull",
          });
        }
        continue;
      }

      // Unmapped remote event on dedicated calendar → create in Aqua
      const aquaEventId = await createCalendarEvent(connection.organizationId, {
        title: remote.title,
        description: remote.description,
        location: remote.location,
        startsAt: new Date(remote.startsAt),
        endsAt: remote.endsAt ? new Date(remote.endsAt) : undefined,
        eventType: "other",
        createdByUserId: connection.userId,
      });
      await upsertEventLink({
        aquaEventId,
        connectionId,
        provider: connection.provider,
        externalCalendarId: connection.externalCalendarId,
        externalEventId: remote.id,
        externalEtag: remote.etag,
        aquaVersionAtSync: 1,
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
    await pushAquaEventToConnection(connectionId, event.id);
  }
}
