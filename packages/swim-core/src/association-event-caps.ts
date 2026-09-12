export type AssociationEventCaps = {
  maxScoringEntriesPerIndividualEvent: number | null;
  maxRelayTeamsPerEvent: number | null;
};

export function resolveAssociationEventCaps(
  team: AssociationEventCaps,
  meetOverride?: Partial<AssociationEventCaps> | null,
): AssociationEventCaps {
  const individual = meetOverride?.maxScoringEntriesPerIndividualEvent;
  const relays = meetOverride?.maxRelayTeamsPerEvent;
  return {
    maxScoringEntriesPerIndividualEvent:
      individual != null && individual > 0
        ? individual
        : team.maxScoringEntriesPerIndividualEvent,
    maxRelayTeamsPerEvent:
      relays != null && relays > 0 ? relays : team.maxRelayTeamsPerEvent,
  };
}

function capAllows(cap: number | null | undefined): cap is number {
  return cap != null && cap > 0;
}

/** Exhibition never counts toward the association scoring cap. */
export function canAddScoringEntry(args: {
  cap: number | null | undefined;
  currentScoringCount: number;
  candidateIsExhibition: boolean;
}): { ok: true } | { ok: false; reason: string } {
  if (args.candidateIsExhibition) return { ok: true };
  if (!capAllows(args.cap)) return { ok: true };
  if (args.currentScoringCount >= args.cap) {
    return {
      ok: false,
      reason: `This event already has ${args.cap} scoring ${args.cap === 1 ? "entry" : "entries"} for your team.`,
    };
  }
  return { ok: true };
}

export function associationCountWithinCap(
  cap: number | null | undefined,
  count: number,
  kind: "scoring" | "relay",
): { ok: true } | { ok: false; reason: string } {
  if (!capAllows(cap)) return { ok: true };
  if (count <= cap) return { ok: true };
  if (kind === "relay") {
    return {
      ok: false,
      reason: `This event already has ${cap} relay ${cap === 1 ? "team" : "teams"} for your team.`,
    };
  }
  return {
    ok: false,
    reason: `This event already has ${cap} scoring ${cap === 1 ? "entry" : "entries"} for your team.`,
  };
}

export function canAddRelayTeam(args: {
  cap: number | null | undefined;
  currentRacingTeamCount: number;
}): { ok: true } | { ok: false; reason: string } {
  return associationCountWithinCap(
    args.cap,
    args.currentRacingTeamCount + 1,
    "relay",
  );
}

export function formatAssociationCapLine(
  caps: AssociationEventCaps,
): string | null {
  const parts: string[] = [];
  if (capAllows(caps.maxScoringEntriesPerIndividualEvent)) {
    const n = caps.maxScoringEntriesPerIndividualEvent;
    parts.push(
      `${n} scoring ${n === 1 ? "swimmer" : "swimmers"} per individual event`,
    );
  }
  if (capAllows(caps.maxRelayTeamsPerEvent)) {
    const n = caps.maxRelayTeamsPerEvent;
    parts.push(`${n} relay ${n === 1 ? "team" : "teams"} per relay event`);
  }
  if (parts.length === 0) return null;
  return parts.join("; ");
}
