import { pullConnectionChanges } from "@project-aqua/calendar-sync/sync";
import { updateCalendarConnection } from "@project-aqua/db/queries/calendar";
import { after } from "next/server";

export async function POST(request: Request) {
  const channelId = request.headers.get("x-goog-channel-id");
  const resourceState = request.headers.get("x-goog-resource-state");

  if (!channelId) {
    return new Response("Missing channel", { status: 400 });
  }

  if (resourceState === "sync") {
    return new Response("ok");
  }

  after(async () => {
    // Find connection by channel id across orgs (channel ids are unique)
    const { db } = await import("@project-aqua/db/client");
    const { calendarConnections } = await import("@project-aqua/db/schema");
    const { eq } = await import("drizzle-orm");
    const [connection] = await db
      .select()
      .from(calendarConnections)
      .where(eq(calendarConnections.channelId, channelId))
      .limit(1);
    if (!connection) return;
    try {
      await pullConnectionChanges(connection.id);
    } catch (error) {
      await updateCalendarConnection(connection.id, {
        status: "error",
        lastError:
          error instanceof Error ? error.message : "Webhook sync failed",
      });
    }
  });

  return new Response("ok");
}
