export type ProgramEventRef = {
  id: string;
  eventNumber: number | null;
  /** Event gender lane: male, female, mixed, etc. */
  gender?: string | null;
};

export type ConsecutiveEventPair = {
  firstEventId: string;
  secondEventId: string;
  firstEventNumber: number;
  secondEventNumber: number;
};

function genderLane(gender: string | null | undefined): string {
  const trimmed = gender?.trim().toLowerCase() ?? "";
  return trimmed || "_";
}

/**
 * Adjacent events in each gender's program (male / female / mixed are
 * separate lanes). Opposite-sex events in between are skipped.
 */
export function consecutiveProgramPairs(
  events: ProgramEventRef[],
): ConsecutiveEventPair[] {
  const numbered = events.filter(
    (event): event is ProgramEventRef & { eventNumber: number } =>
      event.eventNumber != null,
  );

  const byLane = new Map<
    string,
    Array<ProgramEventRef & { eventNumber: number }>
  >();
  for (const event of numbered) {
    const lane = genderLane(event.gender);
    const list = byLane.get(lane) ?? [];
    list.push(event);
    byLane.set(lane, list);
  }

  const pairs: ConsecutiveEventPair[] = [];
  for (const list of byLane.values()) {
    const ordered = list.slice().sort((a, b) => a.eventNumber - b.eventNumber);
    for (let i = 0; i < ordered.length - 1; i++) {
      const first = ordered[i]!;
      const second = ordered[i + 1]!;
      pairs.push({
        firstEventId: first.id,
        secondEventId: second.id,
        firstEventNumber: first.eventNumber,
        secondEventNumber: second.eventNumber,
      });
    }
  }
  return pairs;
}

/** Consecutive pairs this swimmer is entered in (active entries / racing relays). */
export function consecutivePairsForMember(
  enteredEventIds: Iterable<string>,
  events: ProgramEventRef[],
): ConsecutiveEventPair[] {
  const ids =
    enteredEventIds instanceof Set ? enteredEventIds : new Set(enteredEventIds);
  return consecutiveProgramPairs(events).filter(
    (pair) => ids.has(pair.firstEventId) && ids.has(pair.secondEventId),
  );
}

/** Previous event in this event's gender program, if any. */
export function previousSameGenderEvent(
  eventId: string,
  events: ProgramEventRef[],
): ConsecutiveEventPair | null {
  return (
    consecutiveProgramPairs(events).find(
      (pair) => pair.secondEventId === eventId,
    ) ?? null
  );
}
