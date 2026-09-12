import { getSession } from "@project-aqua/auth/session";
import {
  getDefaultPracticeLocation,
  requireTeamMember,
} from "@project-aqua/db/authz";
import {
  getActiveFeedToken,
  getCalendarConnections,
  getRecentSyncConflicts,
  getTeamCalendarProjection,
} from "@project-aqua/db/queries/calendar";
import type { Metadata } from "next";
import { completeCalendarConnectAction } from "./actions";
import { CalendarBoard } from "./calendar-board";
import { CalendarSyncPanel } from "./calendar-sync-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Calendar",
    description: "Team practices, meets, and synced calendar events.",
    alternates: { canonical: `/team/${teamId}/calendar` },
  };
}

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ year?: string; month?: string; connected?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth();

  if (sp.connected === "google" || sp.connected === "microsoft") {
    try {
      await completeCalendarConnectAction(teamId, sp.connected);
    } catch {
      // connection may already be complete
    }
  }

  const from = new Date(year, month, 1);
  const to = new Date(year, month + 1, 0, 23, 59, 59);

  const [events, feed, connections, conflicts, defaultLocation] =
    await Promise.all([
      getTeamCalendarProjection(teamId, { from, to }),
      getActiveFeedToken(teamId),
      session?.user?.id
        ? getCalendarConnections(teamId, session.user.id)
        : Promise.resolve([]),
      getRecentSyncConflicts(teamId),
      getDefaultPracticeLocation(teamId),
    ]);

  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Practices, meets, and team events — with ICS and Google/Outlook sync.
          Collect RSVPs on each{" "}
          <a className="underline" href={`/team/${teamId}/attendance`}>
            practice attendance
          </a>{" "}
          roll.
        </p>
      </div>

      <CalendarBoard
        teamId={teamId}
        initialYear={year}
        initialMonth={month}
        events={events}
        defaultLocation={defaultLocation ?? ""}
      />

      <CalendarSyncPanel
        teamId={teamId}
        feedToken={feed?.token ?? null}
        connections={connections}
        conflicts={conflicts}
        baseUrl={baseUrl}
      />
    </div>
  );
}
