export type EntryLimitPackage = {
  individual: number;
  relay: number;
};

export type MeetEntryLimits = {
  maxIndividualEntries: number | null;
  maxRelayEntries: number | null;
  maxCombinedEntries: number | null;
  entryLimitPackages: EntryLimitPackage[] | null;
};

export type EntryCounts = {
  individual: number;
  relay: number;
};

export function isRelayStroke(stroke: string, eventKey?: string): boolean {
  return (
    stroke.includes("relay") ||
    stroke === "free_relay" ||
    stroke === "medley_relay" ||
    (eventKey?.includes("relay") ?? false)
  );
}

/** Whether adding one more individual or relay entry would stay within limits. */
export function canAddMeetEntry(
  limits: MeetEntryLimits | null | undefined,
  current: EntryCounts,
  candidateIsRelay: boolean,
): { ok: true } | { ok: false; reason: string } {
  if (!limits) return { ok: true };

  const next: EntryCounts = {
    individual: current.individual + (candidateIsRelay ? 0 : 1),
    relay: current.relay + (candidateIsRelay ? 1 : 0),
  };

  const packages = limits.entryLimitPackages?.filter(
    (p) => typeof p?.individual === "number" && typeof p?.relay === "number",
  );

  if (packages && packages.length > 0) {
    const fits = packages.some(
      (p) => next.individual <= p.individual && next.relay <= p.relay,
    );
    if (!fits) {
      const pkgLabel = packages
        .map((p) => `${p.individual} individual + ${p.relay} relay`)
        .join(" or ");
      return {
        ok: false,
        reason: `Entry limits exceeded. Allowed: ${pkgLabel}. Current would be ${next.individual} individual + ${next.relay} relay.`,
      };
    }
    return { ok: true };
  }

  if (
    limits.maxIndividualEntries != null &&
    next.individual > limits.maxIndividualEntries
  ) {
    return {
      ok: false,
      reason: `Maximum individual entries is ${limits.maxIndividualEntries}.`,
    };
  }
  if (limits.maxRelayEntries != null && next.relay > limits.maxRelayEntries) {
    return {
      ok: false,
      reason: `Maximum relay entries is ${limits.maxRelayEntries}.`,
    };
  }
  if (
    limits.maxCombinedEntries != null &&
    next.individual + next.relay > limits.maxCombinedEntries
  ) {
    return {
      ok: false,
      reason: `Maximum combined entries is ${limits.maxCombinedEntries}.`,
    };
  }

  return { ok: true };
}

export function formatEntryLimitsSummary(
  limits: MeetEntryLimits | null | undefined,
): string | null {
  if (!limits) return null;
  const packages = limits.entryLimitPackages;
  if (packages && packages.length > 0) {
    return packages.map((p) => `${p.individual}I + ${p.relay}R`).join(" or ");
  }
  const parts: string[] = [];
  if (limits.maxIndividualEntries != null) {
    parts.push(`${limits.maxIndividualEntries} individual`);
  }
  if (limits.maxRelayEntries != null) {
    parts.push(`${limits.maxRelayEntries} relay`);
  }
  if (limits.maxCombinedEntries != null) {
    parts.push(`${limits.maxCombinedEntries} combined`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
