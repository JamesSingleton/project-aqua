import { formatTime } from "./times";

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
  const next: EntryCounts = {
    individual: current.individual + (candidateIsRelay ? 0 : 1),
    relay: current.relay + (candidateIsRelay ? 1 : 0),
  };
  return checkMeetEntryCounts(limits, next);
}

/** Whether these counts already sit within meet limits (no extra entry). */
export function checkMeetEntryCounts(
  limits: MeetEntryLimits | null | undefined,
  counts: EntryCounts,
): { ok: true } | { ok: false; reason: string } {
  if (!limits) return { ok: true };

  const packages = limits.entryLimitPackages?.filter(
    (p) => typeof p?.individual === "number" && typeof p?.relay === "number",
  );

  if (packages && packages.length > 0) {
    const fits = packages.some(
      (p) => counts.individual <= p.individual && counts.relay <= p.relay,
    );
    if (!fits) {
      const pkgLabel = packages
        .map((p) => `${p.individual} individual + ${p.relay} relay`)
        .join(" or ");
      return {
        ok: false,
        reason: `Entry limits exceeded. Allowed: ${pkgLabel}. Current would be ${counts.individual} individual + ${counts.relay} relay.`,
      };
    }
    return { ok: true };
  }

  if (
    limits.maxIndividualEntries != null &&
    counts.individual > limits.maxIndividualEntries
  ) {
    return {
      ok: false,
      reason: `Maximum individual entries is ${limits.maxIndividualEntries}.`,
    };
  }
  if (limits.maxRelayEntries != null && counts.relay > limits.maxRelayEntries) {
    return {
      ok: false,
      reason: `Maximum relay entries is ${limits.maxRelayEntries}.`,
    };
  }
  if (
    limits.maxCombinedEntries != null &&
    counts.individual + counts.relay > limits.maxCombinedEntries
  ) {
    return {
      ok: false,
      reason: `Maximum combined entries is ${limits.maxCombinedEntries}.`,
    };
  }

  return { ok: true };
}

/**
 * Whether a seed time satisfies a meet event's qualifying time (QT) cutoff.
 *
 * QT events (from Hy-Tek EV3/HYV `qualifyingTimeMs`) expect an entered time
 * at or faster than the cut. A missing seed (NT) is allowed through — the
 * coach can submit "no time" pending verification. A *submitted* time
 * slower than the QT is a **warning** (`ok: false`), not a hard entry block;
 * coaches may still export the lineup.
 */
export function checkQualifyingTime(
  qualifyingTimeMs: number | null | undefined,
  seedTimeMs: number | null | undefined,
): { ok: true } | { ok: false; reason: string } {
  if (qualifyingTimeMs == null || qualifyingTimeMs <= 0) return { ok: true };
  if (seedTimeMs == null || seedTimeMs <= 0) return { ok: true };
  if (seedTimeMs <= qualifyingTimeMs) return { ok: true };

  return {
    ok: false,
    reason: `Seed time ${formatTime(seedTimeMs)} is slower than the meet qualifying time ${formatTime(qualifyingTimeMs)}. Enter a faster time, or clear the seed to submit as no-time (NT).`,
  };
}

function formatMixLabel(mix: EntryLimitPackage): string {
  return `${mix.individual} individual + ${mix.relay} relay`;
}

/**
 * Maximal legal (individual, relay) mixes: packages if present, otherwise
 * the Pareto frontier of the three scalar caps (subsets of each mix are allowed).
 */
export function maximalEntryLimitMixes(
  limits: MeetEntryLimits | null | undefined,
): EntryLimitPackage[] {
  if (!limits) return [];

  const packages = limits.entryLimitPackages?.filter(
    (p) => typeof p?.individual === "number" && typeof p?.relay === "number",
  );
  if (packages && packages.length > 0) return packages;

  const maxI = limits.maxIndividualEntries;
  const maxR = limits.maxRelayEntries;
  const maxC = limits.maxCombinedEntries;
  if (maxI == null && maxR == null && maxC == null) return [];
  if (maxI == null && maxR == null) return [];

  if (maxC == null) {
    if (maxI != null && maxR != null) {
      return [{ individual: maxI, relay: maxR }];
    }
    return [];
  }

  const individualCap = maxI ?? maxC;
  const relayCap = maxR ?? maxC;
  const candidates: EntryLimitPackage[] = [];
  for (let individual = 0; individual <= individualCap; individual++) {
    const relay = Math.min(relayCap, maxC - individual);
    if (relay < 0) continue;
    candidates.push({ individual, relay });
  }

  const mixes = candidates.filter(
    (mix) =>
      !candidates.some(
        (other) =>
          other.individual >= mix.individual &&
          other.relay >= mix.relay &&
          (other.individual > mix.individual || other.relay > mix.relay),
      ),
  );

  return [...mixes].sort((a, b) => b.individual - a.individual);
}

export function formatEntryLimitsSummary(
  limits: MeetEntryLimits | null | undefined,
): string | null {
  if (!limits) return null;

  const mixes = maximalEntryLimitMixes(limits);
  if (mixes.length > 0) {
    return mixes.map(formatMixLabel).join(", or ");
  }

  if (limits.maxCombinedEntries != null) {
    return `up to ${limits.maxCombinedEntries} events in any mix of individual and relay`;
  }
  if (limits.maxIndividualEntries != null) {
    return `up to ${limits.maxIndividualEntries} individual`;
  }
  if (limits.maxRelayEntries != null) {
    return `up to ${limits.maxRelayEntries} relay`;
  }
  return null;
}

/** This swimmer's racing entries, spelled out (alternates omitted). */
export function formatEntryCountsSentence(counts: EntryCounts): string {
  return `${counts.individual} individual, ${counts.relay} relay`;
}

/**
 * How to free a slot when both an extra individual and an extra racing relay
 * are blocked. Only names a swap that would actually be legal.
 */
export function formatFilledCapAdvice(
  limits: MeetEntryLimits | null | undefined,
  counts: EntryCounts,
): string {
  const parts: string[] = [];
  if (
    counts.individual > 0 &&
    canAddMeetEntry(
      limits,
      { individual: counts.individual - 1, relay: counts.relay },
      true,
    ).ok
  ) {
    parts.push("To add a racing relay, remove an individual.");
  }
  if (
    counts.relay > 0 &&
    canAddMeetEntry(
      limits,
      { individual: counts.individual, relay: counts.relay - 1 },
      false,
    ).ok
  ) {
    parts.push("To add an individual, unassign a racing relay.");
  }
  return parts.join(" ");
}
