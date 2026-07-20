import { formatEventName } from "@project-aqua/swim-core/events";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../../actions";
import { getMeetRelayLegsAction } from "../../../relay-actions";
import { EntryMatrix } from "../../entry-matrix";
import { RegistrationBoard } from "../../registration-board";
import { RelaySuggestPanel } from "../../relay-suggest-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return { title: `${detail.meet.name} - Registration` };
}

function isRelayEvent(event: { stroke: string; eventKey: string }) {
  return (
    event.stroke.includes("relay") ||
    event.eventKey.includes("relay") ||
    event.stroke === "free_relay" ||
    event.stroke === "medley_relay"
  );
}

export default async function MeetRegistrationPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { meet, events, entries, commitments, roster, bestTimes } = detail;
  const relayLegs = await getMeetRelayLegsAction(teamId, meetId);
  const nameByMembership = new Map(
    roster.map(
      (r) => [r.membershipId, `${r.firstName} ${r.lastName}`] as const,
    ),
  );

  const relayEvents = events.filter(isRelayEvent).map((event) => {
    const gender =
      event.gender === "female"
        ? "Female"
        : event.gender === "male"
          ? "Male"
          : event.gender === "mixed"
            ? "Mixed"
            : event.gender;
    return {
      id: event.id,
      label: `#${event.eventNumber ?? "—"} ${gender} ${formatEventName(event.distance, event.stroke)}`,
    };
  });

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <RegistrationBoard
        teamId={teamId}
        meetId={meetId}
        course={meet.course}
        meetStartDate={meet.startDate}
        limits={{
          maxIndividualEntries: meet.maxIndividualEntries,
          maxRelayEntries: meet.maxRelayEntries,
          maxCombinedEntries: meet.maxCombinedEntries,
          entryLimitPackages: meet.entryLimitPackages,
        }}
        roster={roster.map((r) => ({
          membershipId: r.membershipId,
          swimmerId: r.swimmerId,
          firstName: r.firstName,
          lastName: r.lastName,
          preferredName: r.preferredName,
          practiceGroup: r.practiceGroup,
          groupId: r.groupId,
          groupName: r.groupName,
          gender: r.gender,
          dateOfBirth: r.dateOfBirth,
        }))}
        events={events.map((e) => ({
          id: e.id,
          eventNumber: e.eventNumber,
          distance: e.distance,
          stroke: e.stroke,
          gender: e.gender,
          ageGroup: e.ageGroup,
          eventKey: e.eventKey,
          qualifyingTimeMs: e.qualifyingTimeMs ?? null,
        }))}
        entries={entries.map((e) => ({
          id: e.id,
          meetEventId: e.meetEventId,
          membershipId: e.membershipId,
          seedTimeMs: e.seedTimeMs,
          status: e.status,
          firstName: e.firstName,
          lastName: e.lastName,
          distance: e.distance,
          stroke: e.stroke,
          eventNumber: e.eventNumber,
          gender: e.gender,
          eventKey: e.eventKey,
        }))}
        commitments={commitments.map((c) => ({
          membershipId: c.membershipId,
          status: c.status,
          firstName: c.firstName,
          lastName: c.lastName,
        }))}
        bestTimes={bestTimes.map((b) => ({
          membershipId: b.membershipId,
          eventKey: b.eventKey,
          timeMs: b.timeMs,
        }))}
      />

      <EntryMatrix
        teamId={teamId}
        meetId={meetId}
        events={events.map((e) => ({
          id: e.id,
          eventNumber: e.eventNumber,
          distance: e.distance,
          stroke: e.stroke,
          gender: e.gender,
        }))}
        swimmers={roster
          .filter((r) =>
            commitments.some(
              (c) =>
                c.membershipId === r.membershipId && c.status === "committed",
            ),
          )
          .map((r) => ({
            membershipId: r.membershipId,
            firstName: r.firstName,
            lastName: r.lastName,
          }))}
        entries={entries.map((e) => ({
          id: e.id,
          meetEventId: e.meetEventId,
          membershipId: e.membershipId,
          status: e.status,
        }))}
      />

      {relayEvents.length > 0 ? (
        <RelaySuggestPanel
          teamId={teamId}
          meetId={meetId}
          events={relayEvents}
          maxRelayEntries={meet.maxRelayEntries}
          initialLegs={relayLegs.map((leg) => ({
            meetEventId: leg.meetEventId,
            membershipId: leg.membershipId,
            legOrder: leg.legOrder,
            stroke: leg.stroke,
            reasoning: leg.reasoning,
            name: nameByMembership.get(leg.membershipId) ?? "Unknown",
          }))}
        />
      ) : null}
    </div>
  );
}
