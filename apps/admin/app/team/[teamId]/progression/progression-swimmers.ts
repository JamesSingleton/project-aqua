export type ProgressionSwimmer = {
  swimmerId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  groupName: string | null;
};

function sortByLastName(a: ProgressionSwimmer, b: ProgressionSwimmer) {
  const last = a.lastName.localeCompare(b.lastName, undefined, {
    sensitivity: "base",
  });
  if (last !== 0) return last;
  const aFirst = a.preferredName?.trim() || a.firstName;
  const bFirst = b.preferredName?.trim() || b.firstName;
  return aFirst.localeCompare(bFirst, undefined, { sensitivity: "base" });
}

export function formatSwimmerLastFirst(s: ProgressionSwimmer) {
  const first = s.preferredName?.trim() || s.firstName;
  return `${s.lastName}, ${first}`;
}

export function sortProgressionSwimmers(swimmers: ProgressionSwimmer[]) {
  return [...swimmers].sort(sortByLastName);
}
