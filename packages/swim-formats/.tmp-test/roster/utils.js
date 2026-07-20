export function parseGenderCode(code) {
  const upper = code.toUpperCase().trim();
  if (
    upper === "F" ||
    upper === "FEMALE" ||
    upper === "GIRL" ||
    upper === "W"
  ) {
    return "female";
  }
  return "male";
}
export function genderFromEventCode(code) {
  const upper = code.toUpperCase();
  if (
    upper.startsWith("FF") ||
    upper.startsWith("FW") ||
    upper.startsWith("FG")
  ) {
    return "female";
  }
  if (
    upper.startsWith("MM") ||
    upper.startsWith("MW") ||
    upper.startsWith("MB")
  ) {
    return "male";
  }
  return undefined;
}
/** Parse MMDDYYYY or MMDDYY from SDIF-style fixed-width fields. */
export function parseSdifBirthDate(raw) {
  const value = raw.trim();
  if (!value) return undefined;
  if (/^\d{8}$/.test(value)) {
    const mm = value.slice(0, 2);
    const dd = value.slice(2, 4);
    const yyyy = value.slice(4, 8);
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{6}$/.test(value)) {
    const mm = value.slice(0, 2);
    const dd = value.slice(2, 4);
    const yy = Number.parseInt(value.slice(4, 6), 10);
    const yyyy = yy > 30 ? 1900 + yy : 2000 + yy;
    return `${yyyy}-${mm}-${dd}`;
  }
  return undefined;
}
/**
 * USA Swimming member IDs often begin with MMDDYY birth date.
 * Example: 041512JOH*DOE* → April 15, 2012
 */
export function parseDobFromUsaMemberId(usaId) {
  const match = usaId.trim().match(/^(\d{2})(\d{2})(\d{2})/);
  if (!match) return undefined;
  const mm = match[1];
  const dd = match[2];
  const yy = match[3];
  const year = Number.parseInt(yy, 10);
  const fullYear = year > 30 ? 1900 + year : 2000 + year;
  return `${fullYear}-${mm}-${dd}`;
}
/** Parse birth date embedded in CL2 results lines: AUSA08192011 */
export function parseAusaBirthDate(line) {
  const match = line.match(/AUSA(\d{2})(\d{2})(\d{4})/i);
  if (!match) return undefined;
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}
export function parseUsaMemberIdFromLine(line) {
  const match = line.match(/\b([A-F0-9]{14})AUSA/i);
  return match?.[1];
}
const CLASS_AGE = {
  FR: 14,
  SO: 15,
  JR: 16,
  SR: 17,
};
/** High school class year → approximate DOB for roster-only exports. */
export function estimateDobFromClassYear(
  classYear,
  seasonYear = new Date().getFullYear(),
) {
  const age = CLASS_AGE[classYear.toUpperCase()] ?? 15;
  return `${seasonYear - age}-07-01`;
}
export function splitSwimmerName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Swimmer" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Swimmer" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
export function parseLastFirstName(name) {
  const cleaned = name.trim().replace(/\s+/g, " ");
  const commaIdx = cleaned.indexOf(",");
  if (commaIdx < 0) {
    const split = splitSwimmerName(cleaned);
    return split;
  }
  const lastName = cleaned.slice(0, commaIdx).trim();
  const nameParts = cleaned
    .slice(commaIdx + 1)
    .trim()
    .split(/\s+/);
  return {
    firstName: nameParts[0] ?? "Unknown",
    lastName,
    middleName: nameParts[1],
  };
}
export function swimmerKey(row) {
  if (row.usaMemberId) return `usa:${row.usaMemberId}`;
  return `name:${row.lastName}|${row.firstName}|${row.dateOfBirth}`;
}
export function mergeSwimmer(map, candidate) {
  const dateOfBirth =
    candidate.dateOfBirth ??
    (candidate.usaMemberId
      ? parseDobFromUsaMemberId(candidate.usaMemberId)
      : undefined);
  if (!dateOfBirth || !candidate.gender) return;
  const row = {
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    dateOfBirth,
    gender: candidate.gender,
    practiceGroup: candidate.practiceGroup,
    usaMemberId: candidate.usaMemberId,
  };
  const key = swimmerKey(row);
  const existing = map.get(key);
  if (!existing) {
    map.set(key, row);
    return;
  }
  map.set(key, {
    ...existing,
    practiceGroup: existing.practiceGroup ?? row.practiceGroup,
    usaMemberId: existing.usaMemberId ?? row.usaMemberId,
  });
}
export function extractSeasonYear(content) {
  const match = content.match(/20\d{6}/);
  if (!match) return undefined;
  const raw = match[0];
  return Number.parseInt(raw.slice(0, 4), 10);
}
