/** Four racing legs plus championship alternates #5–#8 (Hy-Tek F3). */
export const RELAY_PRIMARY_LEG_COUNT = 4;
export const RELAY_ALTERNATE_LEG_COUNT = 4;
export const RELAY_MAX_LEGS = 8;

export const RELAY_TEAM_LETTERS = ["A", "B", "C"] as const;

const MEDLEY_LEG_STROKES = ["back", "breast", "fly", "free"] as const;

export function isRelayAlternateSlot(legOrder: number): boolean {
  return legOrder >= 5 && legOrder <= RELAY_MAX_LEGS;
}

export function relaySlotLabel(legOrder: number): string {
  if (isRelayAlternateSlot(legOrder)) return `Alt ${legOrder}`;
  return `Leg ${legOrder}`;
}

/** Individual stroke that typically feeds this relay slot's split. */
export function strokeForRelayLeg(relayStroke: string, slot: number): string {
  const primary = ((Math.max(1, slot) - 1) % RELAY_PRIMARY_LEG_COUNT) + 1;
  if (relayStroke.includes("medley")) {
    return MEDLEY_LEG_STROKES[primary - 1]!;
  }
  return "free";
}

export function relayLetterFromIndex(teamIndex: number): string {
  return RELAY_TEAM_LETTERS[teamIndex] ?? "A";
}

/**
 * Prefer a stored team letter. Fall back to the legacy 4-leg packing
 * (1–4 → A, 5–8 → B, 9–12 → C) used before `relay_letter` existed.
 */
export function deriveRelayLetter(
  relayLetter: string | null | undefined,
  legOrder: number,
): string {
  const trimmed = relayLetter?.trim();
  if (trimmed) return trimmed.toUpperCase();
  const index = Math.floor(
    (Math.max(1, legOrder) - 1) / RELAY_PRIMARY_LEG_COUNT,
  );
  return relayLetterFromIndex(index);
}
