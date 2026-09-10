import type { ParsedEvent, ParsedMeet } from "../types";

/** Meet program order: event number ascending, unnumbered last. */
export function compareParsedEventNumbers(
  a: ParsedEvent,
  b: ParsedEvent,
): number {
  const an = a.eventNumber ?? Number.MAX_SAFE_INTEGER;
  const bn = b.eventNumber ?? Number.MAX_SAFE_INTEGER;
  if (an !== bn) return an - bn;
  return a.eventKey.localeCompare(b.eventKey);
}

export function withEventsSortedByNumber(meet: ParsedMeet): ParsedMeet {
  return {
    ...meet,
    events: [...meet.events].sort(compareParsedEventNumbers),
  };
}
