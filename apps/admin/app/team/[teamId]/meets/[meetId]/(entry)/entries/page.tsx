import { getSession } from "@project-aqua/auth/session";
import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import { getTeamUiPreferences } from "@project-aqua/db/queries/preferences";
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
import { resolvedAssociationCapsForMeet } from "../../../association-caps";
import { EntriesWorkspace } from "../../entries-workspace";

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
  const session = await getSession();
  const [detail, plan, draftQuotaStatus] = await Promise.all([
    getMeetDetailAction(teamId, meetId),
    getTeamPlan(teamId),
    getAiQuotaStatus(teamId),
  ]);
  if (!detail) notFound();

  const canSuggestLineup = planHasFeature(plan, "lineup_suggestions");
  const draftQuota = toSharedDraftQuota(draftQuotaStatus);

  const {
    meet,
    events: allEvents,
    entries,
    commitments,
    roster,
    bestTimes,
    relayLegs,
    relayTeams,
  } = detail;
  const events = allEvents.filter((e) => e.eventKind !== "dive");
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
  const caps = await resolvedAssociationCapsForMeet(teamId, meet);
  const ui = session?.user?.id
    ? await getTeamUiPreferences(session.user.id, teamId)
    : {};
  const initialView = ui.meetEntriesView === "event" ? "event" : "swimmer";

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
    <EntriesWorkspace
      teamId={teamId}
      meetId={meetId}
      initialView={initialView}
      caps={caps}
      meetLimitsLine={meetLimitsLine}
      canSuggestLineup={canSuggestLineup}
      registration={{
        teamId,
        meetId,
        course: meet.course,
        meetStartDate: meet.startDate,
        limits: meetLimits,
        roster: roster.map((r) => ({
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
        })),
        events: events.map((e) => ({
          id: e.id,
          eventNumber: e.eventNumber,
          distance: e.distance,
          stroke: e.stroke,
          gender: e.gender,
          ageGroup: e.ageGroup,
          eventKey: e.eventKey,
          qualifyingTimeMs: e.qualifyingTimeMs ?? null,
        })),
        entries: entries.map((e) => ({
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
        })),
        attendance: commitments.map((c) => ({
          membershipId: c.membershipId,
          status: c.status,
          notes: c.notes,
          firstName: c.firstName,
          lastName: c.lastName,
        })),
        bestTimes: bestTimes.map((b) => ({
          membershipId: b.membershipId,
          eventKey: b.eventKey,
          timeMs: b.timeMs,
        })),
        relayLegs: relayLegs.map((leg) => ({
          meetEventId: leg.meetEventId,
          membershipId: leg.membershipId,
          legOrder: leg.legOrder,
          relayLetter: leg.relayLetter,
          stroke: leg.stroke,
        })),
      }}
      program={{
        teamId,
        meetId,
        roster: roster.map((r) => ({
          membershipId: r.membershipId,
          firstName: r.firstName,
          lastName: r.lastName,
          gender: r.gender,
          eligibilityStatus: r.eligibilityStatus,
        })),
        events: events.map((e) => ({
          id: e.id,
          eventNumber: e.eventNumber,
          distance: e.distance,
          stroke: e.stroke,
          gender: e.gender,
          eventKey: e.eventKey,
        })),
        entries: entries.map((e) => ({
          id: e.id,
          meetEventId: e.meetEventId,
          membershipId: e.membershipId,
          firstName: e.firstName,
          lastName: e.lastName,
          status: e.status,
          exhibition: e.exhibition,
          seedTimeMs: e.seedTimeMs,
        })),
        relayLegs: relayLegs.map((leg) => ({
          meetEventId: leg.meetEventId,
          membershipId: leg.membershipId,
          legOrder: leg.legOrder,
          relayLetter: leg.relayLetter,
        })),
        relayTeams: relayTeams.map((team) => ({
          meetEventId: team.meetEventId,
          relayLetter: team.relayLetter,
          seedTimeMs: team.seedTimeMs,
        })),
        notGoingMembershipIds: [...notGoingMembershipIds],
      }}
      relayPanel={
        relayEvents.length > 0
          ? {
              teamId,
              meetId,
              events: relayEvents,
              initialLegs: relayLegs.map((leg) => ({
                meetEventId: leg.meetEventId,
                membershipId: leg.membershipId,
                legOrder: leg.legOrder,
                relayLetter: leg.relayLetter,
                stroke: leg.stroke,
                reasoning: leg.reasoning,
                name: nameByMembership.get(leg.membershipId) ?? "Unknown",
              })),
              initialTeams: relayTeams.map((team) => ({
                meetEventId: team.meetEventId,
                relayLetter: team.relayLetter,
                seedTimeMs: team.seedTimeMs,
              })),
              limits: meetLimits,
              individualCountByMembership,
              candidates: activeRoster.map((r) => ({
                membershipId: r.membershipId,
                name: `${r.firstName} ${r.lastName}`,
                gender: r.gender,
              })),
              bestTimes: bestTimes.map((b) => ({
                membershipId: b.membershipId,
                eventKey: b.eventKey,
                timeMs: b.timeMs,
              })),
              draftQuota,
            }
          : null
      }
    />
  );
}
