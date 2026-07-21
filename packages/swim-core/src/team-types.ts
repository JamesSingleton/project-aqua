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

/** College academic standing (includes graduate). */
export const ACADEMIC_STANDINGS = ["FR", "SO", "JR", "SR", "GR"] as const;
export type AcademicStanding = (typeof ACADEMIC_STANDINGS)[number];

export const ACADEMIC_STANDING_LABELS: Record<AcademicStanding, string> = {
  FR: "Freshman",
  SO: "Sophomore",
  JR: "Junior",
  SR: "Senior",
  GR: "Graduate",
};

export const ELIGIBILITY_STATUSES = [
  "competing",
  "redshirt",
  "medical",
  "exhausted",
  "ineligible",
  "other",
] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const ELIGIBILITY_STATUS_LABELS: Record<EligibilityStatus, string> = {
  competing: "Competing",
  redshirt: "Redshirt",
  medical: "Medical",
  exhausted: "Exhausted",
  ineligible: "Ineligible",
  other: "Other",
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

/** College eligibility tracking applies to college teams. */
export function supportsCollegeEligibility(
  teamType: string | null | undefined,
): boolean {
  return teamType === "college";
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

export function parseAcademicStanding(value: unknown): AcademicStanding | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return (ACADEMIC_STANDINGS as readonly string[]).includes(normalized)
    ? (normalized as AcademicStanding)
    : null;
}

export function parseEligibilityStatus(
  value: unknown,
): EligibilityStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (ELIGIBILITY_STATUSES as readonly string[]).includes(normalized)
    ? (normalized as EligibilityStatus)
    : null;
}

/** Advance HS class year for a new season; SR has no next year. */
export function advanceClassYear(
  classYear: ClassYear | null,
): ClassYear | null {
  if (!classYear) return null;
  const idx = CLASS_YEARS.indexOf(classYear);
  if (idx < 0 || idx >= CLASS_YEARS.length - 1) return null;
  return CLASS_YEARS[idx + 1]!;
}

/** Advance college academic standing; GR stays GR. */
export function advanceAcademicStanding(
  standing: AcademicStanding | null,
): AcademicStanding | null {
  if (!standing) return null;
  if (standing === "GR") return "GR";
  const idx = ACADEMIC_STANDINGS.indexOf(standing);
  if (idx < 0 || idx >= ACADEMIC_STANDINGS.length - 1) return standing;
  return ACADEMIC_STANDINGS[idx + 1]!;
}

/**
 * Proposed seasons-of-competition for next season.
 * Bumps +1 only when prior status was competing.
 */
export function advanceSeasonsOfCompetitionUsed(
  used: number | null | undefined,
  priorStatus: EligibilityStatus | null | undefined,
): number | null {
  if (used == null && priorStatus !== "competing") return used ?? null;
  const base = used ?? 0;
  if (priorStatus === "competing") return base + 1;
  return base;
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

/** Distinct event display: "100 Backstroke - SCY - Girls" */
export function formatBestTimeEventLabel(
  label: string | null | undefined,
  course: string,
  gender: string | null | undefined,
  teamType?: string | null,
): string {
  const base = label?.trim() || "Event";
  return `${base} - ${course} - ${formatEventGenderLabel(gender, teamType)}`;
}
