export const TEAM_TYPES = [
  {
    value: "club",
    label: "USA Swimming Club",
    description: "USA Swimming member club — SafeSport/MAAPP and SWIMS apply",
  },
  {
    value: "high_school",
    label: "High School",
    description: "School/athletic association team — SafeSport not required",
  },
  {
    value: "college",
    label: "College",
    description: "Collegiate program — SafeSport not required via USA Swimming",
  },
  {
    value: "national",
    label: "National",
    description: "National/elite program — SafeSport typically applies",
  },
] as const;

export type TeamType = (typeof TEAM_TYPES)[number]["value"];

/** High school class years used in Hy-Tek / Meet Manager exports. */
export const CLASS_YEARS = ["FR", "SO", "JR", "SR"] as const;
export type ClassYear = (typeof CLASS_YEARS)[number];

export const CLASS_YEAR_LABELS: Record<ClassYear, string> = {
  FR: "Freshman",
  SO: "Sophomore",
  JR: "Junior",
  SR: "Senior",
};

const USA_SWIMMING_COMPLIANCE_TYPES = new Set<string>(["club", "national"]);

/**
 * SafeSport training and MAAPP apply to USA Swimming–affiliated programs.
 * High school and college teams are generally outside that requirement.
 */
export function requiresSafeSportCompliance(
  teamType: string | null | undefined,
): boolean {
  return USA_SWIMMING_COMPLIANCE_TYPES.has(teamType ?? "club");
}

/** SWIMS / USA Swimming club tooling is only relevant for USA Swimming teams. */
export function supportsUsaSwimmingIntegration(
  teamType: string | null | undefined,
): boolean {
  return requiresSafeSportCompliance(teamType);
}

/** Class year (FR/SO/JR/SR) applies to high school teams. */
export function supportsClassYear(
  teamType: string | null | undefined,
): boolean {
  return teamType === "high_school";
}

export function parseTeamType(value: unknown): TeamType {
  const match = TEAM_TYPES.find((t) => t.value === value);
  return match?.value ?? "club";
}

export function parseClassYear(value: unknown): ClassYear | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (CLASS_YEARS as readonly string[]).includes(normalized)
    ? (normalized as ClassYear)
    : null;
}

export function teamTypeLabel(teamType: string | null | undefined): string {
  const match = TEAM_TYPES.find((t) => t.value === (teamType ?? "club"));
  return match?.label ?? "USA Swimming Club";
}

/**
 * Competitive-category labels for UI (not DB gender values).
 * - high_school → Boys / Girls
 * - college → Men / Women
 * - club → Boys / Girls (age-group convention; club rosters are usually youth-heavy)
 * - national → Men / Women (senior/elite leaning)
 */
export function formatEventGenderLabel(
  gender: string | null | undefined,
  teamType?: string | null,
): string {
  const g = (gender ?? "").toLowerCase().trim();
  if (g === "mixed" || g === "x" || g === "open") return "Mixed";

  const isFemale =
    g === "female" || g === "f" || g === "g" || g === "girl" || g === "w";

  const type = parseTeamType(teamType);
  if (type === "college" || type === "national") {
    return isFemale ? "Women" : "Men";
  }
  // high_school + club
  return isFemale ? "Girls" : "Boys";
}
