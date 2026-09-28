import type { MeetCommitmentStatus } from "./validators";

/** Coach-facing attendance; absence of a commitment row means committed. */
export type MeetAttendanceUiStatus =
  | "committed"
  | "pending"
  | "not_going"
  | "not_eligible";

export const MEET_ATTENDANCE_UI_LABELS: Record<MeetAttendanceUiStatus, string> =
  {
    committed: "Committed",
    pending: "Pending",
    not_going: "Not going",
    not_eligible: "Not eligible",
  };

export type MeetCoachAttendanceStatus = Exclude<
  MeetAttendanceUiStatus,
  "committed"
>;

export function normalizeMeetCommitmentStatus(
  status: string,
): MeetCommitmentStatus | "not_going" {
  if (status === "declined") return "not_going";
  return status as MeetCommitmentStatus;
}

export function resolveMeetAttendanceUiStatus(
  commitmentStatus: string | null | undefined,
): MeetAttendanceUiStatus {
  if (!commitmentStatus) return "committed";
  const normalized = normalizeMeetCommitmentStatus(commitmentStatus);
  switch (normalized) {
    case "pending":
      return "pending";
    case "not_going":
      return "not_going";
    case "not_eligible":
      return "not_eligible";
    case "committed":
      return "committed";
    default:
      return "committed";
  }
}

/** Blocks entering events (not export-only pending). */
export function blocksMeetEntryForAttendance(
  commitmentStatus: string | null | undefined,
): boolean {
  const ui = resolveMeetAttendanceUiStatus(commitmentStatus);
  return ui === "not_going" || ui === "not_eligible";
}

/** Omits swimmer from HY3/CL2/SD3 host packs and lineup export filters. */
export function excludesFromMeetExport(
  commitmentStatus: string | null | undefined,
): boolean {
  const ui = resolveMeetAttendanceUiStatus(commitmentStatus);
  return ui === "pending" || ui === "not_going" || ui === "not_eligible";
}

export type MeetCommitmentMaps = {
  pendingIds: Set<string>;
  notGoingIds: Set<string>;
  meetNotEligibleIds: Set<string>;
};

export function indexMeetCommitments(
  commitments: Array<{ membershipId: string; status: string }> | undefined,
): MeetCommitmentMaps {
  const pendingIds = new Set<string>();
  const notGoingIds = new Set<string>();
  const meetNotEligibleIds = new Set<string>();
  for (const commitment of commitments ?? []) {
    const ui = resolveMeetAttendanceUiStatus(commitment.status);
    if (ui === "pending") pendingIds.add(commitment.membershipId);
    else if (ui === "not_going") notGoingIds.add(commitment.membershipId);
    else if (ui === "not_eligible") {
      meetNotEligibleIds.add(commitment.membershipId);
    }
  }
  return { pendingIds, notGoingIds, meetNotEligibleIds };
}

export function listPendingExportExclusions(
  commitments: Array<{
    membershipId: string;
    status: string;
    firstName?: string;
    lastName?: string;
  }>,
): string[] {
  const names: string[] = [];
  for (const commitment of commitments) {
    if (resolveMeetAttendanceUiStatus(commitment.status) !== "pending") {
      continue;
    }
    const name =
      commitment.firstName && commitment.lastName
        ? `${commitment.firstName} ${commitment.lastName}`.trim()
        : commitment.membershipId;
    names.push(name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}
