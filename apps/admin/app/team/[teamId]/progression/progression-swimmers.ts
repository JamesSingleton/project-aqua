import {
  formatSwimmerLastFirst,
  sortSwimmersByLastName,
} from "@project-aqua/swim-core/people";

export type ProgressionSwimmer = {
  swimmerId: string;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  groupName: string | null;
};

export { formatSwimmerLastFirst };

export function sortProgressionSwimmers(swimmers: ProgressionSwimmer[]) {
  return sortSwimmersByLastName(swimmers);
}
