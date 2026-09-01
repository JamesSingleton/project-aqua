import {
  canAddMeetEntry,
  checkQualifyingTime,
  isRelayStroke,
  type MeetEntryLimits,
} from "./entry-limits";
import { isSwimmerEligibleForEvent } from "./events";

/** Per-swimmer cap when the meet does not set a max individual count. */
export const DEFAULT_INDIVIDUAL_LINEUP_CAP = 3;

export type LineupSuggestionCandidate = {
  membershipId: string;
  gender: "male" | "female";
  bestByEventKey: Record<string, number>;
};

export type LineupSuggestionEvent = {
  id: string;
  eventKey: string;
  stroke: string;
  gender: string;
  qualifyingTimeMs: number | null;
};

export type LineupSuggestionExisting = {
  membershipId: string;
  meetEventId: string;
  eventKey?: string;
  stroke: string;
  status: string;
};

export type SuggestedLineupEntry = {
  membershipId: string;
  meetEventId: string;
  eventKey: string;
  seedTimeMs: number | null;
  seedTimeSource: "personal_best" | "no_time";
  warning?: string;
};

function countsFor(
  membershipId: string,
  existing: LineupSuggestionExisting[],
  pending: SuggestedLineupEntry[],
): { individual: number; relay: number } {
  let individual = 0;
  let relay = 0;
  for (const e of existing) {
    if (e.membershipId !== membershipId) continue;
    if (e.status === "scratched") continue;
    if (isRelayStroke(e.stroke, e.eventKey)) relay += 1;
    else individual += 1;
  }
  for (const e of pending) {
    if (e.membershipId !== membershipId) continue;
    individual += 1;
  }
  return { individual, relay };
}

/**
 * Deterministic individual-event lineup: each candidate is assigned their
 * fastest remaining eligible events (then NT events) until meet limits stop
 * further adds. Relays are left to the dedicated relay helper.
 */
export function suggestIndividualLineup(input: {
  events: LineupSuggestionEvent[];
  candidates: LineupSuggestionCandidate[];
  existing: LineupSuggestionExisting[];
  limits: MeetEntryLimits | null;
}): { entries: SuggestedLineupEntry[] } {
  const individualEvents = input.events.filter(
    (event) => !isRelayStroke(event.stroke, event.eventKey),
  );
  if (individualEvents.length === 0) return { entries: [] };

  const alreadyEntered = new Set(
    input.existing
      .filter((e) => e.status !== "scratched")
      .map((e) => `${e.membershipId}:${e.meetEventId}`),
  );

  const entries: SuggestedLineupEntry[] = [];
  const maxWithoutMeetCap = DEFAULT_INDIVIDUAL_LINEUP_CAP;

  for (const candidate of input.candidates) {
    const eligible = individualEvents.filter((event) => {
      if (alreadyEntered.has(`${candidate.membershipId}:${event.id}`)) {
        return false;
      }
      return isSwimmerEligibleForEvent(candidate.gender, event.gender);
    });

    const ranked = [...eligible].sort((a, b) => {
      const aTime = candidate.bestByEventKey[a.eventKey];
      const bTime = candidate.bestByEventKey[b.eventKey];
      const aHas = aTime != null && aTime > 0;
      const bHas = bTime != null && bTime > 0;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      if (aHas && bHas) return aTime - bTime;
      return a.eventKey.localeCompare(b.eventKey);
    });

    const meetCap = input.limits?.maxIndividualEntries;
    if (meetCap === 0) continue;
    const personalCap =
      meetCap != null && meetCap > 0 ? meetCap : maxWithoutMeetCap;

    for (const event of ranked) {
      const current = countsFor(
        candidate.membershipId,
        input.existing,
        entries,
      );
      if (current.individual >= personalCap) break;

      const limitCheck = canAddMeetEntry(input.limits, current, false);
      if (!limitCheck.ok) break;

      const seedTimeMs = candidate.bestByEventKey[event.eventKey] ?? null;
      const seedTimeSource: "personal_best" | "no_time" =
        seedTimeMs != null && seedTimeMs > 0 ? "personal_best" : "no_time";
      const qt = checkQualifyingTime(event.qualifyingTimeMs, seedTimeMs);

      entries.push({
        membershipId: candidate.membershipId,
        meetEventId: event.id,
        eventKey: event.eventKey,
        seedTimeMs: seedTimeSource === "personal_best" ? seedTimeMs : null,
        seedTimeSource,
        warning: qt.ok ? undefined : qt.reason,
      });
    }
  }

  return { entries };
}
