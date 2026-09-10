/**
 * Project Aqua roster share pack — coach-to-coach identity linking.
 *
 * Contains opaque aqua swimmer IDs plus minimal confirm fields only.
 * Never includes contacts, medical, email, or phone.
 */

export const ROSTER_SHARE_PACK_FORMAT = "project-aqua-roster-share" as const;
export const ROSTER_SHARE_PACK_VERSION = 1 as const;

export type RosterSharePackAthlete = {
  aquaSwimmerId: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth: string;
  gender: "male" | "female";
  /** Optional USA Swimming / governing-body ID when known (not required). */
  governingBodyId?: string | null;
};

export type RosterSharePack = {
  format: typeof ROSTER_SHARE_PACK_FORMAT;
  version: typeof ROSTER_SHARE_PACK_VERSION;
  exportedAt: string;
  sourceOrganizationId: string;
  sourceOrganizationName: string;
  athletes: RosterSharePackAthlete[];
};

export type RosterSharePackBuildInput = {
  sourceOrganizationId: string;
  sourceOrganizationName: string;
  exportedAt?: string;
  athletes: RosterSharePackAthlete[];
};

function isGender(value: unknown): value is "male" | "female" {
  return value === "male" || value === "female";
}

function normalizeAthlete(raw: unknown): RosterSharePackAthlete | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const aquaSwimmerId =
    typeof row.aquaSwimmerId === "string" ? row.aquaSwimmerId.trim() : "";
  const firstName =
    typeof row.firstName === "string" ? row.firstName.trim() : "";
  const lastName = typeof row.lastName === "string" ? row.lastName.trim() : "";
  const dateOfBirth =
    typeof row.dateOfBirth === "string"
      ? row.dateOfBirth.trim().slice(0, 10)
      : "";
  if (!aquaSwimmerId || !firstName || !lastName || !dateOfBirth) return null;
  if (!isGender(row.gender)) return null;

  const preferredName =
    typeof row.preferredName === "string" && row.preferredName.trim()
      ? row.preferredName.trim()
      : null;
  const governingBodyId =
    typeof row.governingBodyId === "string" && row.governingBodyId.trim()
      ? row.governingBodyId.trim()
      : null;

  return {
    aquaSwimmerId,
    firstName,
    lastName,
    preferredName,
    dateOfBirth,
    gender: row.gender,
    governingBodyId,
  };
}

/** True when filename looks like a Project Aqua share pack. */
export function isRosterSharePackFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return (
    lower.endsWith(".aqua.json") ||
    lower.endsWith(".aqua-roster.json") ||
    (lower.endsWith(".json") && lower.includes("share"))
  );
}

/** True when content is a v1 Project Aqua roster share pack. */
export function isRosterSharePack(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return (
      parsed.format === ROSTER_SHARE_PACK_FORMAT &&
      parsed.version === ROSTER_SHARE_PACK_VERSION &&
      Array.isArray(parsed.athletes)
    );
  } catch {
    return false;
  }
}

export function buildRosterSharePack(
  input: RosterSharePackBuildInput,
): RosterSharePack {
  const athletes = input.athletes
    .map((athlete) =>
      normalizeAthlete({
        aquaSwimmerId: athlete.aquaSwimmerId,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        preferredName: athlete.preferredName ?? null,
        dateOfBirth: athlete.dateOfBirth,
        gender: athlete.gender,
        governingBodyId: athlete.governingBodyId ?? null,
      }),
    )
    .filter((row): row is RosterSharePackAthlete => row != null);

  // Deduplicate by opaque id (same person selected twice).
  const byId = new Map<string, RosterSharePackAthlete>();
  for (const athlete of athletes) {
    byId.set(athlete.aquaSwimmerId, athlete);
  }

  return {
    format: ROSTER_SHARE_PACK_FORMAT,
    version: ROSTER_SHARE_PACK_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    sourceOrganizationId: input.sourceOrganizationId,
    sourceOrganizationName: input.sourceOrganizationName,
    athletes: [...byId.values()],
  };
}

export function serializeRosterSharePack(pack: RosterSharePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export function parseRosterSharePack(content: string): RosterSharePack {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Invalid roster share pack: not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid roster share pack: expected an object");
  }

  const root = parsed as Record<string, unknown>;
  if (root.format !== ROSTER_SHARE_PACK_FORMAT) {
    throw new Error("Invalid roster share pack: unrecognized format");
  }
  if (root.version !== ROSTER_SHARE_PACK_VERSION) {
    throw new Error(
      `Unsupported roster share pack version: ${String(root.version)}`,
    );
  }
  if (
    typeof root.sourceOrganizationId !== "string" ||
    !root.sourceOrganizationId
  ) {
    throw new Error("Invalid roster share pack: missing source organization");
  }
  if (
    typeof root.sourceOrganizationName !== "string" ||
    !root.sourceOrganizationName.trim()
  ) {
    throw new Error("Invalid roster share pack: missing source team name");
  }
  if (!Array.isArray(root.athletes) || root.athletes.length === 0) {
    throw new Error("Invalid roster share pack: no athletes");
  }

  const athletes: RosterSharePackAthlete[] = [];
  for (const row of root.athletes) {
    const athlete = normalizeAthlete(row);
    if (!athlete) {
      throw new Error(
        "Invalid roster share pack: athlete missing id, name, DOB, or gender",
      );
    }
    athletes.push(athlete);
  }

  return {
    format: ROSTER_SHARE_PACK_FORMAT,
    version: ROSTER_SHARE_PACK_VERSION,
    exportedAt:
      typeof root.exportedAt === "string" && root.exportedAt
        ? root.exportedAt
        : new Date(0).toISOString(),
    sourceOrganizationId: root.sourceOrganizationId,
    sourceOrganizationName: root.sourceOrganizationName.trim(),
    athletes,
  };
}

/** Suggested download name for a share pack. */
export function rosterSharePackFilename(teamName: string): string {
  const slug = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "team"}-roster-share.aqua.json`;
}
