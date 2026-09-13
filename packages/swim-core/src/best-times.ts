import { isFasterTime } from "./times";

export type BestTimeUpdate = {
  previousMs: number | null;
  nextMs: number | null;
  isPersonalBest: boolean;
};

/**
 * Apply a finished swim to a best-time slot. DQ / empty times never
 * replace an existing best. A first legal time is always a personal best.
 */
export function applyResultToBestTime(
  currentMs: number | null | undefined,
  resultMs: number,
  options?: { isDq?: boolean },
): BestTimeUpdate {
  const previousMs = currentMs != null && currentMs > 0 ? currentMs : null;
  if (options?.isDq || resultMs <= 0) {
    return { previousMs, nextMs: previousMs, isPersonalBest: false };
  }
  if (previousMs == null || isFasterTime(resultMs, previousMs)) {
    return { previousMs, nextMs: resultMs, isPersonalBest: true };
  }
  return { previousMs, nextMs: previousMs, isPersonalBest: false };
}
