import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import {
  formatEntryLimitsSummary,
  isRelayStroke,
} from "@project-aqua/swim-core/entry-limits";
import { formatEventName } from "@project-aqua/swim-core/events";
import { planHasFeature } from "@project-aqua/swim-core/plans";
import { blocksMeetEntries } from "@project-aqua/swim-core/team-types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toSharedDraftQuota } from "@/lib/draft-quota";
import { getMeetDetailAction } from "../../../actions";
import {
  getMeetRelayLegsAction,
  getMeetRelayTeamsAction,
} from "../../../relay-actions";
import { EntryMatrix } from "../../entry-matrix";
import { LineupSuggestPanel } from "../../lineup-suggest-panel";
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
  return { title: `${detail.meet.name} - Entries` };
}

function isRelayEvent(event: { stroke: string; eventKey: string }) {
  return (
    event.stroke.includes("relay") ||
    event.eventKey.includes("relay") ||
    event.stroke === "free_relay" ||
    event.stroke === "medley_relay"
  );
}

function isMeetExcluded(status: string) {
  return status === "not_going";
}

export default async function MeetEntriesPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const plan = await getTeamPlan(teamId);
  const canSuggestLineup = planHasFeature(plan, "lineup_suggestions");
  const draftQuotaStatus = await getAiQuotaStatus(teamId);
  const draftQuota = toSharedDraftQuota(draftQuotaStatus);

  const {
    meet,
    events: allEvents,
    entries,
    commitments,
    roster,
    bestTimes,
  } = detail;
  const events = allEvents.filter((e) => e.eventKind !== "dive");
  const relayLegs = await getMeetRelayLegsAction(teamId, meetId);
  const relayTeams = await getMeetRelayTeamsAction(teamId, meetId);
  const relayLegMembershipIds = [
    ...new Set(relayLegs.map((leg) => leg.membershipId)),
  ];
  const nameByMembership = new Map(
    roster.map(
      (r) => [r.membershipId, `${r.firstName} ${r.lastName}`] as const,
    ),
  );

  const notGoingMembershipIds = new Set(
    commitments
      .filter((c) => isMeetExcluded(c.status))
      .map((c) => c.membershipId),
  );

  const activeRoster = roster.filter(
    (r) =>
      !notGoingMembershipIds.has(r.membershipId) &&
      !blocksMeetEntries(r.eligibilityStatus),
  );

  const enteredMembershipIds = new Set([
    ...entries
      .filter(
        (e) => e.status !== "scratched" && !isRelayStroke(e.stroke, e.eventKey),
      )
      .map((e) => e.membershipId),
    ...relayLegMembershipIds,
  ]);

  const individualCountByMembership: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.status === "scratched") continue;
    if (isRelayStroke(entry.stroke, entry.eventKey)) continue;
    individualCountByMembership[entry.membershipId] =
      (individualCountByMembership[entry.membershipId] ?? 0) + 1;
  }

  const meetLimits = {
    maxIndividualEntries: meet.maxIndividualEntries,
    maxRelayEntries: meet.maxRelayEntries,
    maxCombinedEntries: meet.maxCombinedEntries,
    entryLimitPackages: meet.entryLimitPackages,
  };
  const meetLimitsLine = formatEntryLimitsSummary(meetLimits);

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
      stroke: event.stroke,
      eventKey: event.eventKey,
      gender: event.gender,
    };
  });

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {meetLimitsLine ? (
        <p className="text-muted-foreground text-sm">
          Meet allows {meetLimitsLine}.
        </p>
      ) : null}
      <RegistrationBoard
        teamId={teamId}
        meetId={meetId}
        course={meet.course}
        meetStartDate={meet.startDate}
        limits={meetLimits}
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
          eligibilityStatus: r.eligibilityStatus,
          eligibilityNotes: r.eligibilityNotes,
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
          exhibition: e.exhibition,
          entryNotes: e.entryNotes,
          firstName: e.firstName,
          lastName: e.lastName,
          distance: e.distance,
          stroke: e.stroke,
          eventNumber: e.eventNumber,
          gender: e.gender,
          eventKey: e.eventKey,
        }))}
        attendance={commitments.map((c) => ({
          membershipId: c.membershipId,
          status: c.status,
          notes: c.notes,
          firstName: c.firstName,
          lastName: c.lastName,
        }))}
        bestTimes={bestTimes.map((b) => ({
          membershipId: b.membershipId,
          eventKey: b.eventKey,
          timeMs: b.timeMs,
        }))}
        relayLegs={relayLegs.map((leg) => ({
          meetEventId: leg.meetEventId,
          membershipId: leg.membershipId,
          legOrder: leg.legOrder,
          relayLetter: leg.relayLetter,
          stroke: leg.stroke,
        }))}
      />

      <EntryMatrix
        teamId={teamId}
        meetId={meetId}
        limits={meetLimits}
        events={events.map((e) => ({
          id: e.id,
          eventNumber: e.eventNumber,
          distance: e.distance,
          stroke: e.stroke,
          gender: e.gender,
          eventKey: e.eventKey,
          qualifyingTimeMs: e.qualifyingTimeMs ?? null,
        }))}
        swimmers={activeRoster
          .filter((r) => enteredMembershipIds.has(r.membershipId))
          .map((r) => ({
            membershipId: r.membershipId,
            firstName: r.firstName,
            lastName: r.lastName,
          }))}
        entries={entries
          .filter((e) => !isRelayStroke(e.stroke, e.eventKey))
          .map((e) => ({
            id: e.id,
            meetEventId: e.meetEventId,
            membershipId: e.membershipId,
            status: e.status,
            seedTimeMs: e.seedTimeMs,
            exhibition: e.exhibition,
          }))}
        relayLegs={relayLegs.map((leg) => ({
          id: `relay:${leg.meetEventId}:${leg.relayLetter}:${leg.legOrder}:${leg.membershipId}`,
          meetEventId: leg.meetEventId,
          membershipId: leg.membershipId,
          relayLetter: leg.relayLetter,
          legOrder: leg.legOrder,
          stroke: leg.stroke,
        }))}
      />

      <LineupSuggestPanel
        teamId={teamId}
        meetId={meetId}
        available={canSuggestLineup}
      />

      {relayEvents.length > 0 ? (
        <RelaySuggestPanel
          teamId={teamId}
          meetId={meetId}
          events={relayEvents}
          initialLegs={relayLegs.map((leg) => ({
            meetEventId: leg.meetEventId,
            membershipId: leg.membershipId,
            legOrder: leg.legOrder,
            relayLetter: leg.relayLetter,
            stroke: leg.stroke,
            reasoning: leg.reasoning,
            name: nameByMembership.get(leg.membershipId) ?? "Unknown",
          }))}
          initialTeams={relayTeams.map((team) => ({
            meetEventId: team.meetEventId,
            relayLetter: team.relayLetter,
            seedTimeMs: team.seedTimeMs,
          }))}
          limits={meetLimits}
          individualCountByMembership={individualCountByMembership}
          candidates={activeRoster.map((r) => ({
            membershipId: r.membershipId,
            name: `${r.firstName} ${r.lastName}`,
            gender: r.gender,
          }))}
          bestTimes={bestTimes.map((b) => ({
            membershipId: b.membershipId,
            eventKey: b.eventKey,
            timeMs: b.timeMs,
          }))}
          draftQuota={draftQuota}
        />
      ) : null}
    </div>
  );
}
