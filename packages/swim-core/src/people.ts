export type NamedSwimmer = {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
};

/** Collapse a person name for fuzzy matching (lowercase, alphanumerics only). */
export function normalizePersonName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type SwimmerIdentity = {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  dateOfBirth: string;
};

/** Canonical DOB slice (YYYY-MM-DD) for identity compares. */
export function normalizeDateOfBirth(dateOfBirth: string): string {
  return dateOfBirth.trim().slice(0, 10);
}

/**
 * True when two records are the same person for cross-team linking:
 * same DOB and matching last name, with first/preferred name overlap.
 * Does not require USA Swimming ID.
 */
export function swimmerIdentitiesMatch(
  a: SwimmerIdentity,
  b: SwimmerIdentity,
): boolean {
  if (
    normalizeDateOfBirth(a.dateOfBirth) !== normalizeDateOfBirth(b.dateOfBirth)
  ) {
    return false;
  }
  if (normalizePersonName(a.lastName) !== normalizePersonName(b.lastName)) {
    return false;
  }

  const aFirsts = [a.firstName, a.preferredName]
    .filter((v): v is string => Boolean(v?.trim()))
    .map((v) => normalizePersonName(v));
  const bFirsts = [b.firstName, b.preferredName]
    .filter((v): v is string => Boolean(v?.trim()))
    .map((v) => normalizePersonName(v));

  return aFirsts.some((name) => bFirsts.includes(name));
}

/** Display as "Last, PreferredOrFirst". */
export function formatSwimmerLastFirst(s: NamedSwimmer): string {
  const first = s.preferredName?.trim() || s.firstName;
  return `${s.lastName}, ${first}`;
}

function compareByLastName(a: NamedSwimmer, b: NamedSwimmer): number {
  const last = a.lastName.localeCompare(b.lastName, undefined, {
    sensitivity: "base",
  });
  if (last !== 0) return last;
  const aFirst = a.preferredName?.trim() || a.firstName;
  const bFirst = b.preferredName?.trim() || b.firstName;
  return aFirst.localeCompare(bFirst, undefined, { sensitivity: "base" });
}

/** Immutable sort by last name, then preferred/first name. */
export function sortSwimmersByLastName<T extends NamedSwimmer>(
  swimmers: T[],
): T[] {
  return [...swimmers].sort(compareByLastName);
}
