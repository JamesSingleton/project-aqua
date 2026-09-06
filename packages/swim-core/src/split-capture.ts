import type { Course } from "./events";
import { RELAY_PRIMARY_LEG_COUNT, strokeForRelayLeg } from "./relay-legs";

export type SplitCaptureMark = {
  /** Cumulative race distance at this write-in (25, 50, 100, …). */
  cumulativeDistance: number;
  isFinal: boolean;
};

export type SplitCapturePlan = {
  interval: number;
  marks: SplitCaptureMark[];
};

export const SPLIT_CAPTURE_INTERVALS = [25, 50, 100] as const;
export type SplitCaptureInterval = (typeof SPLIT_CAPTURE_INTERVALS)[number];

/** Skip an override that would print more individual write-ins than this. */
export const SPLIT_CAPTURE_MAX_INDIVIDUAL_MARKS = 20;

const IM_STROKE_LABELS = ["Fly", "Back", "Breast", "Free"] as const;

export function parseSplitCaptureInterval(
  value: string | number | null | undefined,
): SplitCaptureInterval | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 25 || n === 50 || n === 100) return n;
  return undefined;
}

function intervalForIndividual(distance: number, course: Course): number {
  if (distance === 50) {
    return course === "LCM" ? 50 : 25;
  }
  if (distance <= 500) return 50;
  return 100;
}

function resolvedIndividualInterval(
  distance: number,
  course: Course,
  override?: SplitCaptureInterval,
): number {
  const auto = intervalForIndividual(distance, course);
  if (override == null) return auto;
  if (override > distance) return auto;
  const markCount = Math.ceil(distance / override);
  if (markCount > SPLIT_CAPTURE_MAX_INDIVIDUAL_MARKS) return auto;
  return override;
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function clampIndex(value: number): 0 | 1 | 2 | 3 {
  if (value <= 0) return 0;
  if (value >= 3) return 3;
  if (value === 1) return 1;
  return 2;
}

/**
 * Stroke to print next to a split distance. IM uses fly → back → breast →
 * free; medley relays use one stroke per racing leg. Other events: null.
 */
export function splitCaptureStrokeHint(options: {
  stroke: string;
  distance: number;
  cumulativeDistance: number;
  interval: number;
  isRelay?: boolean;
  relayLegOrder?: number;
}): string | null {
  const stroke = options.stroke.toLowerCase();
  if (options.isRelay) {
    if (!stroke.includes("medley")) return null;
    const order = options.relayLegOrder ?? 1;
    if (order >= 5) return null;
    return sentenceCase(strokeForRelayLeg(stroke, order));
  }
  if (stroke !== "im") return null;
  if (options.distance <= 0 || options.interval <= 0) return null;
  const strokeLength = options.distance / 4;
  const start = Math.max(0, options.cumulativeDistance - options.interval);
  const from = clampIndex(Math.floor(start / strokeLength));
  const to = clampIndex(
    Math.floor((options.cumulativeDistance - 1) / strokeLength),
  );
  if (from === to) return IM_STROKE_LABELS[from];
  return IM_STROKE_LABELS.slice(from, to + 1).join("/");
}

export function formatSplitCaptureLabel(
  cumulativeDistance: number,
  strokeHint: string | null,
): string {
  return strokeHint
    ? `${cumulativeDistance} (${strokeHint})`
    : String(cumulativeDistance);
}

/**
 * Blank split-sheet cadence: 25s in a SCY/SCM 50, 50s through 500,
 * 100s above 500 (with a leftover 50 on 1650). Relays are one mark
 * per racing leg at cumulative team distance.
 */
export function splitCapturePlan(options: {
  distance: number;
  course: Course;
  isRelay?: boolean;
  relayLegCount?: number;
  /** Individual events only. Relays stay one box per racing leg. */
  interval?: SplitCaptureInterval;
}): SplitCapturePlan {
  const { distance, course } = options;
  if (distance <= 0) {
    return { interval: 0, marks: [] };
  }

  if (options.isRelay) {
    const legs = options.relayLegCount ?? RELAY_PRIMARY_LEG_COUNT;
    if (legs < 1) {
      return { interval: 0, marks: [] };
    }
    const interval = distance / legs;
    const marks: SplitCaptureMark[] = [];
    for (let i = 1; i <= legs; i++) {
      const cumulative = i === legs ? distance : Math.round(interval * i);
      marks.push({
        cumulativeDistance: cumulative,
        isFinal: i === legs,
      });
    }
    return { interval, marks };
  }

  const interval = resolvedIndividualInterval(
    distance,
    course,
    options.interval,
  );
  const marks: SplitCaptureMark[] = [];
  let at = interval;
  while (at < distance) {
    marks.push({ cumulativeDistance: at, isFinal: false });
    at += interval;
  }
  marks.push({ cumulativeDistance: distance, isFinal: true });
  return { interval, marks };
}
