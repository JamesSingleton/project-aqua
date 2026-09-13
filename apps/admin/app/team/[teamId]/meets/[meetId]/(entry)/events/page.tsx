import { getSession } from "@project-aqua/auth/session";
import { assertFeature } from "@project-aqua/billing/features";
import { requireTeamRole } from "@project-aqua/db/authz";
import { listMeetEventTemplatesSafe } from "@project-aqua/db/queries/meet-event-templates";
import {
  getMeetRelayLegsDetailed,
  getMeets,
} from "@project-aqua/db/queries/meets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../../actions";
import { MeetEventsPanel } from "../../meet-events-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return { title: `${detail.meet.name} - Events` };
}

async function canManageMeetEvents(teamId: string) {
  const session = await getSession();
  try {
    await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);
    await assertFeature(teamId, "meet_import");
    return true;
  } catch {
    return false;
  }
}

export default async function MeetEventsPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { meet, events, entries } = detail;
  const canManage = await canManageMeetEvents(teamId);

  const entryCountByEvent = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status === "scratched") continue;
    entryCountByEvent.set(
      entry.meetEventId,
      (entryCountByEvent.get(entry.meetEventId) ?? 0) + 1,
    );
  }

  const relayLegs = await getMeetRelayLegsDetailed(meetId);
  for (const leg of relayLegs) {
    entryCountByEvent.set(
      leg.meetEventId,
      Math.max(entryCountByEvent.get(leg.meetEventId) ?? 0, 1),
    );
  }

  const [teamTemplates, allMeets] = await Promise.all([
    canManage ? listMeetEventTemplatesSafe(teamId) : Promise.resolve([]),
    canManage ? getMeets(teamId) : Promise.resolve([]),
  ]);

  const otherMeets = allMeets
    .filter((row) => row.id !== meetId)
    .map((row) => ({ id: row.id, name: row.name }));

  const eventRows = events.map((event) => ({
    id: event.id,
    eventNumber: event.eventNumber,
    stroke: event.stroke,
    distance: event.distance,
    gender: event.gender,
    ageGroup: event.ageGroup,
    qualifyingTimeMs: event.qualifyingTimeMs,
    eventKey: event.eventKey,
    entryCount: entryCountByEvent.get(event.id) ?? 0,
    importedFromFile: event.importedFromFile,
  }));

  const importedFromFile = Boolean(meet.importSource);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          {events.length} event{events.length === 1 ? "" : "s"}
          {importedFromFile
            ? " from the meet file. Event number, stroke, distance, and gender stay locked on imported events. You can still add events, and edit age group and qualifying time."
            : ". Add events manually or import a meet file."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MeetEventsPanel
          teamId={teamId}
          meetId={meetId}
          events={eventRows}
          canManage={canManage}
          teamTemplates={teamTemplates.map((template) => ({
            id: template.id,
            name: template.name,
            course: template.course,
            events: template.events,
          }))}
          otherMeets={otherMeets}
          fileBackedMeet={importedFromFile}
        />
      </CardContent>
    </Card>
  );
}
