import { formatTime, parseTime } from "@lane4hq/swim-core/times";
import type {
  ParsedEntry,
  ParsedEvent,
  ParsedMeet,
  ParsedRelayEntry,
  ParsedResult,
} from "@lane4hq/swim-formats";
import { eventLabel, eventLabelsByNumber } from "./meet-labels";

export type FieldChange = {
  field: string;
  original: string;
  candidate: string;
};

export type DiffRow =
  | { status: "missing"; key: string; label: string }
  | { status: "extra"; key: string; label: string }
  | { status: "changed"; key: string; label: string; changes: FieldChange[] };

export type SectionDiff = {
  original: number;
  candidate: number;
  matched: number;
  rows: DiffRow[];
};

export const DIFF_SECTIONS = [
  "events",
  "entries",
  "results",
  "relays",
] as const;

export type DiffSection = (typeof DIFF_SECTIONS)[number];

export type MeetDiff = Record<DiffSection, SectionDiff>;

/** A plain string, or `[comparable, display]` when they differ. */
type FieldValue = string | readonly [compare: string, display: string];

type Spec<T> = {
  key: (item: T) => string;
  label: (item: T) => string;
  fields: Record<string, (item: T) => FieldValue>;
};

function compareValue(value: FieldValue): string {
  return typeof value === "string" ? value : value[0];
}

function displayValue(value: FieldValue): string {
  return typeof value === "string" ? value : value[1];
}

/**
 * Hy-Tek files disagree on name order ("Last, First" vs "First Last") and
 * punctuation, so names compare as a sorted bag of lowercase tokens.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/** Canonical time string; course suffixes and NT/blank collapse to "NT". */
export function normalizeTime(time: string | undefined): string {
  const clean = time?.replace(/[^\d:.]/g, "") ?? "";
  if (!clean) return "NT";
  const ms = parseTime(clean);
  return Number.isFinite(ms) && ms > 0 ? formatTime(ms) : "NT";
}

function text(value: string | number | boolean | undefined): string {
  if (value == null || value === "") return "—";
  return String(value);
}

function diffSection<T>(
  original: readonly T[],
  candidate: readonly T[],
  spec: Spec<T>,
): SectionDiff {
  const pending = new Map<string, T[]>();
  for (const item of candidate) {
    const key = spec.key(item);
    const bucket = pending.get(key);
    if (bucket) bucket.push(item);
    else pending.set(key, [item]);
  }

  const rows: DiffRow[] = [];
  let matched = 0;
  for (const item of original) {
    const key = spec.key(item);
    const other = pending.get(key)?.shift();
    if (!other) {
      rows.push({ status: "missing", key, label: spec.label(item) });
      continue;
    }
    matched++;
    const changes: FieldChange[] = [];
    for (const [field, read] of Object.entries(spec.fields)) {
      const a = read(item);
      const b = read(other);
      if (compareValue(a) !== compareValue(b)) {
        changes.push({
          field,
          original: displayValue(a),
          candidate: displayValue(b),
        });
      }
    }
    if (changes.length > 0) {
      rows.push({ status: "changed", key, label: spec.label(item), changes });
    }
  }
  for (const [key, leftovers] of pending) {
    for (const item of leftovers) {
      rows.push({ status: "extra", key, label: spec.label(item) });
    }
  }

  return {
    original: original.length,
    candidate: candidate.length,
    matched,
    rows,
  };
}

function eventRef(labels: Map<number, string>, eventNumber?: number): string {
  if (eventNumber == null) return "No event";
  const label = labels.get(eventNumber);
  return label ? `#${eventNumber} ${label}` : `#${eventNumber}`;
}

/**
 * Compare a source meet with Lane4's re-export of it. Rows are paired by
 * identity (event number, swimmer, team + relay letter); repeated identities
 * pair in file order. Only differences are returned.
 */
export function diffMeets(
  original: ParsedMeet,
  candidate: ParsedMeet,
): MeetDiff {
  const labels = eventLabelsByNumber(original.events);
  for (const [n, label] of eventLabelsByNumber(candidate.events)) {
    if (!labels.has(n)) labels.set(n, label);
  }

  const events: Spec<ParsedEvent> = {
    key: (e) => (e.eventNumber != null ? `#${e.eventNumber}` : e.eventKey),
    label: (e) =>
      e.eventNumber != null
        ? `#${e.eventNumber} ${eventLabel(e)}`
        : eventLabel(e),
    fields: {
      distance: (e) => text(e.distance),
      stroke: (e) => text(e.stroke),
      gender: (e) => text(e.gender),
      "age group": (e) => text(e.ageGroup),
    },
  };

  const entries: Spec<ParsedEntry> = {
    key: (e) => `${e.eventNumber ?? "?"}|${normalizeName(e.swimmerName)}`,
    label: (e) => `${e.swimmerName} · ${eventRef(labels, e.eventNumber)}`,
    fields: {
      seed: (e) => normalizeTime(e.seedTime),
      exhibition: (e) => (e.exhibition ? "yes" : "no"),
    },
  };

  const results: Spec<ParsedResult> = {
    key: (r) =>
      `${r.eventNumber ?? "?"}|${normalizeName(r.swimmerName)}|${r.resultType ?? ""}`,
    label: (r) =>
      `${r.swimmerName} · ${eventRef(labels, r.eventNumber)}${r.resultType ? ` (${r.resultType})` : ""}`,
    fields: {
      time: (r) => (r.isDq ? "DQ" : normalizeTime(r.time)),
      place: (r) => text(r.place),
    },
  };

  const relays: Spec<ParsedRelayEntry> = {
    key: (r) =>
      `${r.eventNumber ?? "?"}|${(r.teamCode ?? "").toUpperCase()}|${(r.relayLetter ?? "").toUpperCase()}`,
    label: (r) =>
      `${[r.teamCode, r.relayLetter].filter(Boolean).join(" ") || "Relay"} · ${eventRef(labels, r.eventNumber)}`,
    fields: {
      seed: (r) => normalizeTime(r.seedTime),
      swimmers: (r) => [
        r.swimmerNames.map(normalizeName).join(" / "),
        r.swimmerNames.join(", ") || "—",
      ],
      result: (r) => {
        const first = r.results?.[0];
        if (!first) return "—";
        return first.isDq ? "DQ" : normalizeTime(first.time);
      },
    },
  };

  return {
    events: diffSection(original.events, candidate.events, events),
    entries: diffSection(original.entries, candidate.entries, entries),
    results: diffSection(original.results, candidate.results, results),
    relays: diffSection(original.relays ?? [], candidate.relays ?? [], relays),
  };
}

export function hasDifferences(diff: MeetDiff): boolean {
  return DIFF_SECTIONS.some((section) => diff[section].rows.length > 0);
}
