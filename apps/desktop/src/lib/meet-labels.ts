import type { ParsedEvent } from "@lane4hq/swim-formats";

const GENDER_LABEL: Record<string, string> = {
  male: "Boys",
  female: "Girls",
  mixed: "Mixed",
};

const STROKE_LABEL: Record<string, string> = {
  free: "Free",
  back: "Back",
  breast: "Breast",
  fly: "Fly",
  im: "IM",
  free_relay: "Free Relay",
  medley_relay: "Medley Relay",
};

export function eventLabel(event: ParsedEvent): string {
  const gender = GENDER_LABEL[event.gender] ?? event.gender;
  const age = event.ageGroup ? `${event.ageGroup} ` : "";
  const stroke = STROKE_LABEL[event.stroke] ?? event.stroke;
  return `${gender} ${age}${event.distance} ${stroke}`;
}

export function eventLabelsByNumber(
  events: ParsedEvent[],
): Map<number, string> {
  const labels = new Map<number, string>();
  for (const event of events) {
    if (event.eventNumber != null) {
      labels.set(event.eventNumber, eventLabel(event));
    }
  }
  return labels;
}

export function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null;
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}
