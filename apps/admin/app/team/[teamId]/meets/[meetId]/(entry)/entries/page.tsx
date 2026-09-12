import { getSession } from "@project-aqua/auth/session";
import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import { getTeamUiPreferences } from "@project-aqua/db/queries/preferences";
import type { TeamUiState } from "@project-aqua/db/schema";
import { formatEntryLimitsSummary } from "@project-aqua/swim-core/entry-limits";
import { planHasFeature } from "@project-aqua/swim-core/plans";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toSharedDraftQuota } from "@/lib/draft-quota";
import { getMeetDetailAction } from "../../../actions";
import { resolvedAssociationCapsForMeet } from "../../../association-caps";
import {
  EntriesWorkspace,
  type MeetEntriesSharedData,
} from "../../entries-workspace";

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

  const notGoingMembershipIds = [
    ...new Set(
      commitments
        .filter((c) => isMeetExcluded(c.status))
        .map((c) => c.membershipId),
    ),
  ];

  const meetLimits = {
    maxIndividualEntries: meet.maxIndividualEntries,
    maxRelayEntries: meet.maxRelayEntries,
    maxCombinedEntries: meet.maxCombinedEntries,
    entryLimitPackages: meet.entryLimitPackages,
  };
  const meetLimitsLine = formatEntryLimitsSummary(meetLimits);
  const uiPromise = session?.user?.id
    ? getTeamUiPreferences(session.user.id, teamId)
    : Promise.resolve<TeamUiState>({});
  const [caps, ui] = await Promise.all([
    resolvedAssociationCapsForMeet(teamId, meet),
    uiPromise,
  ]);
  const initialView = ui.meetEntriesView === "event" ? "event" : "swimmer";

  const shared: MeetEntriesSharedData = {
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
    commitments: commitments.map((c) => ({
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
      reasoning: leg.reasoning,
    })),
    relayTeams: relayTeams.map((team) => ({
      meetEventId: team.meetEventId,
      relayLetter: team.relayLetter,
      seedTimeMs: team.seedTimeMs,
    })),
    notGoingMembershipIds,
  };

  return (
    <EntriesWorkspace
      shared={shared}
      initialView={initialView}
      caps={caps}
      meetLimitsLine={meetLimitsLine}
      canSuggestLineup={canSuggestLineup}
      draftQuota={draftQuota}
    />
  );
}
