export type MeetEventSnapshot = {
  eventNumber: number | null;
  eventKey: string;
  stroke: string;
  distance: number;
  gender: string;
  importedFromFile?: boolean;
};

export type MeetEventImportConflict = {
  eventNumber: number;
  manual: MeetEventSnapshot;
  imported: MeetEventSnapshot;
};

export type EventConflictResolution = "keep_manual" | "use_import";

function snapshot(
  event: MeetEventSnapshot & { eventNumber?: number | null },
): MeetEventSnapshot | null {
  if (event.eventNumber == null) return null;
  return {
    eventNumber: event.eventNumber,
    eventKey: event.eventKey,
    stroke: event.stroke,
    distance: event.distance,
    gender: event.gender,
    importedFromFile: event.importedFromFile,
  };
}

function eventsMatch(a: MeetEventSnapshot, b: MeetEventSnapshot): boolean {
  return a.eventKey === b.eventKey;
}

/** Same event # but different stroke/distance/gender/key → coach must decide. */
export function detectMeetEventImportConflicts(
  existing: MeetEventSnapshot[],
  imported: Array<MeetEventSnapshot & { eventNumber?: number | null }>,
): MeetEventImportConflict[] {
  const byNumber = new Map<number, MeetEventSnapshot>();
  for (const event of existing) {
    if (event.eventNumber != null) {
      byNumber.set(event.eventNumber, event);
    }
  }

  const conflicts: MeetEventImportConflict[] = [];

  for (const raw of imported) {
    const importedSnap = snapshot(raw);
    if (!importedSnap || importedSnap.eventNumber == null) continue;
    const manual = byNumber.get(importedSnap.eventNumber);
    if (!manual) continue;
    if (eventsMatch(manual, importedSnap)) continue;
    conflicts.push({
      eventNumber: importedSnap.eventNumber,
      manual,
      imported: importedSnap,
    });
  }

  return conflicts;
}

export function resolveImportedEventForMerge(
  existing: MeetEventSnapshot | undefined,
  imported: MeetEventSnapshot,
  resolution: EventConflictResolution | undefined,
): "skip" | "add" | "replace" | "refresh" {
  if (!existing) return "add";
  if (eventsMatch(existing, imported)) {
    return existing.importedFromFile ? "refresh" : "skip";
  }
  if (!existing.importedFromFile) return "skip";
  if (resolution === "use_import") return "replace";
  return "skip";
}
