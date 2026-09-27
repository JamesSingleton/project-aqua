import { buildIcsCalendar } from "@lane4hq/db/calendar-ics";
import { db } from "@lane4hq/db/client";
import {
  getFeedTokenByValue,
  getTeamCalendarProjection,
} from "@lane4hq/db/queries/calendar";
import { organization } from "@lane4hq/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await context.params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  const feed = await getFeedTokenByValue(token);
  if (!feed || feed.organizationId !== teamId) {
    return new Response("Invalid token", { status: 401 });
  }

  const [org] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  const to = new Date();
  to.setFullYear(to.getFullYear() + 1);

  const events = await getTeamCalendarProjection(teamId, { from, to });
  const ics = buildIcsCalendar(org?.name ?? "Team calendar", events);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="lane4hq-${teamId}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
