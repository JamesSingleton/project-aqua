import { pullConnectionChanges } from "@project-aqua/calendar-sync/sync";
import { updateCalendarConnection } from "@project-aqua/db/queries/calendar";
import { after } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const validationToken = url.searchParams.get("validationToken");
  if (validationToken) {
    return new Response(validationToken, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const body = (await request.json().catch(() => null)) as {
    value?: Array<{ clientState?: string; subscriptionId?: string }>;
  } | null;

  const items = body?.value ?? [];
  after(async () => {
    for (const item of items) {
      const connectionId = item.clientState;
      if (!connectionId) continue;
      try {
        await pullConnectionChanges(connectionId);
      } catch (error) {
        await updateCalendarConnection(connectionId, {
          status: "error",
          lastError:
            error instanceof Error ? error.message : "Webhook sync failed",
        });
      }
    }
  });

  return new Response("ok");
}
