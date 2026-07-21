export const COURSES = ["SCY", "SCM", "LCM"] as const;
export type Course = (typeof COURSES)[number];

export const STROKES = ["free", "back", "breast", "fly", "im"] as const;
export type Stroke = (typeof STROKES)[number];

export type RelayStroke = "free_relay" | "medley_relay";

/** Athlete gender (never mixed). */
export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

/** Event / meet-event gender (includes mixed relays/open). */
export const EVENT_GENDERS = ["male", "female", "mixed"] as const;
export type EventGender = (typeof EVENT_GENDERS)[number];

/** Compact code used in eventKey suffixes (_m / _f / _x). */
export type EventGenderCode = "m" | "f" | "x";

export type EventKey =
  `${number}_${Stroke | RelayStroke}_${Lowercase<Course>}_${EventGenderCode}`;

export interface SwimEvent {
  key: EventKey;
  distance: number;
  stroke: Stroke;
  course: Course;
  gender: EventGender;
  label: string;
}

const STROKE_LABELS: Record<Stroke | RelayStroke, string> = {
  free: "Freestyle",
  back: "Backstroke",
  breast: "Breaststroke",
  fly: "Butterfly",
  im: "IM",
  free_relay: "Freestyle Relay",
  medley_relay: "Medley Relay",
};

export function eventGenderToCode(gender: EventGender): EventGenderCode {
  if (gender === "female") return "f";
  if (gender === "mixed") return "x";
  return "m";
}

export function eventGenderFromCode(
  code: string | null | undefined,
): EventGender {
  const c = (code ?? "").toLowerCase().trim();
  if (
    c === "f" ||
    c === "female" ||
    c === "g" ||
    c === "girl" ||
    c === "w" ||
    c === "women"
  ) {
    return "female";
  }
  if (c === "x" || c === "mixed" || c === "open") return "mixed";
  return "male";
}

/** Parse Hy-Tek / SDIF / EV3 gender tokens into EventGender. */
export function parseEventGender(raw: string | null | undefined): EventGender {
  return eventGenderFromCode(raw);
}

export function isSwimmerEligibleForEvent(
  swimmerGender: Gender,
  eventGender: EventGender | string,
): boolean {
  const eg =
    eventGender === "male" ||
    eventGender === "female" ||
    eventGender === "mixed"
      ? eventGender
      : eventGenderFromCode(eventGender);
  if (eg === "mixed") return true;
  return eg === swimmerGender;
}

/** Human-readable stroke label (never snake_case). */
export function formatStrokeLabel(stroke: string): string {
  const known = STROKE_LABELS[stroke as Stroke | RelayStroke];
  if (known) return known;
  const spaced = stroke.replaceAll("_", " ").trim();
  if (!spaced) return stroke;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** Display name for a meet event, e.g. "200 Medley Relay". */
export function formatEventName(distance: number, stroke: string): string {
  return `${distance} ${formatStrokeLabel(stroke)}`;
}

export function buildEventKey(
  distance: number,
  stroke: Stroke | RelayStroke,
  course: Course,
  gender: EventGender | EventGenderCode,
): EventKey {
  const code: EventGenderCode =
    gender === "m" || gender === "f" || gender === "x"
      ? gender
      : eventGenderToCode(gender);
  return `${distance}_${stroke}_${course.toLowerCase() as Lowercase<Course>}_${code}`;
}

/** Display label for catalog rows, e.g. "50 Freestyle" (course/gender live in columns). */
export function formatEventLabel(
  distance: number,
  stroke: Stroke | RelayStroke,
): string {
  return formatEventName(distance, stroke);
}

/** Inverse of `buildEventKey` — parse distance/stroke/course/gender from a key. */
export function parseEventKey(eventKey: string): {
  distance: number;
  stroke: string;
  course: Course;
  gender: EventGender;
} | null {
  const parts = eventKey.split("_");
  if (parts.length < 4) return null;
  const genderCode = parts[parts.length - 1] /* v8 ignore next */ ?? "m";
  const courseRaw = (
    parts[parts.length - 2] /* v8 ignore next */ ?? "scy"
  ).toUpperCase();
  if (courseRaw !== "SCY" && courseRaw !== "SCM" && courseRaw !== "LCM") {
    return null;
  }
  const distance = Number.parseInt(parts[0] /* v8 ignore next */ ?? "", 10);
  if (!Number.isFinite(distance)) return null;
  const stroke = parts.slice(1, -2).join("_");
  if (!stroke) return null;
  return {
    distance,
    stroke,
    course: courseRaw,
    gender: eventGenderFromCode(genderCode),
  };
}

/** Compact gender letter for dense UI (F / M / X). */
export function formatGenderShort(gender: string): string {
  if (gender === "female" || gender === "f") return "F";
  if (gender === "mixed" || gender === "x") return "X";
  if (gender === "male" || gender === "m") return "M";
  return "";
}

/** Neutral gender word (Female / Male / Mixed). */
export function formatGenderLabel(gender: string): string {
  if (gender === "female" || gender === "f") return "Female";
  if (gender === "mixed" || gender === "x") return "Mixed";
  if (gender === "male" || gender === "m") return "Male";
  return gender;
}

export const COMMON_EVENTS: SwimEvent[] = [
  {
    distance: 50,
    stroke: "free",
    course: "SCY",
    gender: "male",
    key: "50_free_scy_m",
    label: "50 Freestyle",
  },
  {
    distance: 50,
    stroke: "free",
    course: "SCY",
    gender: "female",
    key: "50_free_scy_f",
    label: "50 Freestyle",
  },
  {
    distance: 100,
    stroke: "free",
    course: "SCY",
    gender: "male",
    key: "100_free_scy_m",
    label: "100 Freestyle",
  },
  {
    distance: 100,
    stroke: "free",
    course: "SCY",
    gender: "female",
    key: "100_free_scy_f",
    label: "100 Freestyle",
  },
  {
    distance: 200,
    stroke: "free",
    course: "SCY",
    gender: "male",
    key: "200_free_scy_m",
    label: "200 Freestyle",
  },
  {
    distance: 200,
    stroke: "free",
    course: "SCY",
    gender: "female",
    key: "200_free_scy_f",
    label: "200 Freestyle",
  },
  {
    distance: 100,
    stroke: "fly",
    course: "SCY",
    gender: "male",
    key: "100_fly_scy_m",
    label: "100 Butterfly",
  },
  {
    distance: 100,
    stroke: "fly",
    course: "SCY",
    gender: "female",
    key: "100_fly_scy_f",
    label: "100 Butterfly",
  },
  {
    distance: 100,
    stroke: "back",
    course: "SCY",
    gender: "male",
    key: "100_back_scy_m",
    label: "100 Backstroke",
  },
  {
    distance: 100,
    stroke: "back",
    course: "SCY",
    gender: "female",
    key: "100_back_scy_f",
    label: "100 Backstroke",
  },
  {
    distance: 100,
    stroke: "breast",
    course: "SCY",
    gender: "male",
    key: "100_breast_scy_m",
    label: "100 Breaststroke",
  },
  {
    distance: 100,
    stroke: "breast",
    course: "SCY",
    gender: "female",
    key: "100_breast_scy_f",
    label: "100 Breaststroke",
  },
  {
    distance: 200,
    stroke: "im",
    course: "SCY",
    gender: "male",
    key: "200_im_scy_m",
    label: "200 IM",
  },
  {
    distance: 200,
    stroke: "im",
    course: "SCY",
    gender: "female",
    key: "200_im_scy_f",
    label: "200 IM",
  },
];
