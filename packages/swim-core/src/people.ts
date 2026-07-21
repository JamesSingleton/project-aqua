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
