import { formatEventGenderLabel } from "@project-aqua/swim-core/team-types";

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
