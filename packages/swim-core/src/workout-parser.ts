export type WorkoutIntensity =
  | "easy"
  | "moderate"
  | "threshold"
  | "race"
  | "sprint"
  | "recovery"
  | "unknown";

export type ParsedWorkoutSet = {
  sortOrder: number;
  section: string | null;
  reps: number;
  distance: number;
  stroke: string;
  intensity: WorkoutIntensity;
  interval: string | null;
  notes: string | null;
  rawLine: string;
};

export type ParsedWorkout = {
  sets: ParsedWorkoutSet[];
  totalDistance: number;
  warnings: string[];
};

const SECTION_RE =
  /^(warm[\s-]?up|wu|pre[\s-]?set|main|main set|ms|cool[\s-]?down|cd|warm down|drill|kick|pull)\b[:\s-]*/i;

const SET_RE =
  /^(\d+)\s*[x×*]\s*(\d+)\s*(free|fr|fly|fl|back|bk|breast|br|im|choice|ch|kick|k|pull|p|drill|dr)?(?:\s+@?\s*([\d:.\s+-]+))?(?:\s+(easy|moderate|mod|threshold|thresh|race|sprint|sp|recovery|rec|fast|slow))?\s*(.*)?$/i;

const DISTANCE_ONLY_RE =
  /^(\d+)\s*(free|fr|fly|fl|back|bk|breast|br|im|choice|ch|kick|k|pull|p|drill|dr)?(?:\s+@?\s*([\d:.\s+-]+))?(?:\s+(easy|moderate|mod|threshold|thresh|race|sprint|sp|recovery|rec|fast|slow))?\s*(.*)?$/i;

function normalizeStroke(raw?: string | null): string {
  if (!raw) return "free";
  const s = raw.toLowerCase();
  if (s === "fr" || s === "free") return "free";
  if (s === "fl" || s === "fly") return "fly";
  if (s === "bk" || s === "back") return "back";
  if (s === "br" || s === "breast") return "breast";
  if (s === "im") return "im";
  if (s === "ch" || s === "choice") return "choice";
  if (s === "k" || s === "kick") return "kick";
  if (s === "p" || s === "pull") return "pull";
  if (s === "dr" || s === "drill") return "drill";
  return s;
}

function normalizeIntensity(raw?: string | null): WorkoutIntensity {
  if (!raw) return "unknown";
  const s = raw.toLowerCase();
  if (s === "easy" || s === "slow" || s === "rec" || s === "recovery") {
    return s === "slow" || s === "easy" ? "easy" : "recovery";
  }
  if (s === "mod" || s === "moderate") return "moderate";
  if (s === "thresh" || s === "threshold") return "threshold";
  if (s === "race" || s === "fast") return "race";
  if (s === "sp" || s === "sprint") return "sprint";
  return "unknown";
}

function normalizeSection(raw: string): string {
  const s = raw.toLowerCase().replace(/[\s-]+/g, "");
  if (s.startsWith("wu") || s.startsWith("warm")) return "warmup";
  if (s.startsWith("cd") || s.includes("cool") || s.includes("warndown")) {
    return "cooldown";
  }
  if (s.startsWith("pre")) return "preset";
  if (s.startsWith("main") || s === "ms") return "main";
  if (s.startsWith("drill")) return "drill";
  if (s.startsWith("kick")) return "kick";
  if (s.startsWith("pull")) return "pull";
  return raw.toLowerCase();
}

/** @internal Normalization helpers exposed for unit tests. */
export const workoutParserNormalization = {
  normalizeStroke,
  normalizeIntensity,
  normalizeSection,
};

/**
 * Parse coach-style plain-text workouts into structured sets.
 * Examples:
 *   Warm-up
 *   4x100 free @ 1:30 easy
 *   Main
 *   8x50 fly @ :50 race
 *   200 IM
 *   Cool-down
 *   200 choice
 */
export function parseWorkoutText(rawText: string): ParsedWorkout {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  const sets: ParsedWorkoutSet[] = [];
  const warnings: string[] = [];
  let section: string | null = null;
  let sortOrder = 0;

  for (const line of lines) {
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch && !SET_RE.test(line) && !/^\d+\s*[x×*]/.test(line)) {
      section = normalizeSection(sectionMatch[1]!);
      continue;
    }

    const setMatch = line.match(SET_RE);
    if (setMatch) {
      const reps = Number(setMatch[1]);
      const distance = Number(setMatch[2]);
      sets.push({
        sortOrder: sortOrder++,
        section,
        reps,
        distance,
        stroke: normalizeStroke(setMatch[3]),
        intensity: normalizeIntensity(setMatch[5]),
        interval: setMatch[4]?.trim() || null,
        notes: setMatch[6]?.trim() || null,
        rawLine: line,
      });
      continue;
    }

    const distMatch = line.match(DISTANCE_ONLY_RE);
    if (distMatch && Number(distMatch[1]) >= 25) {
      sets.push({
        sortOrder: sortOrder++,
        section,
        reps: 1,
        distance: Number(distMatch[1]),
        stroke: normalizeStroke(distMatch[2]),
        intensity: normalizeIntensity(distMatch[4]),
        interval: distMatch[3]?.trim() || null,
        notes: distMatch[5]?.trim() || null,
        rawLine: line,
      });
      continue;
    }

    warnings.push(`Unparsed line: ${line}`);
  }

  const totalDistance = sets.reduce(
    (sum, set) => sum + set.reps * set.distance,
    0,
  );

  return { sets, totalDistance, warnings };
}

/** Rough Levenshtein distance for AI draft vs saved text feedback. */
export function textEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  const curr: number[] = Array.from({ length: n + 1 }, () => 0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]!;
  }
  return prev[n]!;
}
