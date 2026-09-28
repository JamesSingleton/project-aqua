import { describe, expect, it } from "vitest";
import {
  blocksMeetEntryForAttendance,
  excludesFromMeetExport,
  indexMeetCommitments,
  listPendingExportExclusions,
  normalizeMeetCommitmentStatus,
  resolveMeetAttendanceUiStatus,
} from "../src/meet-attendance";

describe("meet-attendance", () => {
  it("defaults missing commitment to committed", () => {
    expect(resolveMeetAttendanceUiStatus(undefined)).toBe("committed");
    expect(resolveMeetAttendanceUiStatus(null)).toBe("committed");
  });

  it("maps declined to not_going", () => {
    expect(normalizeMeetCommitmentStatus("declined")).toBe("not_going");
    expect(normalizeMeetCommitmentStatus("pending")).toBe("pending");
    expect(resolveMeetAttendanceUiStatus("declined")).toBe("not_going");
  });

  it("separates entry blocks from export exclusion for pending", () => {
    expect(blocksMeetEntryForAttendance(undefined)).toBe(false);
    expect(blocksMeetEntryForAttendance("pending")).toBe(false);
    expect(excludesFromMeetExport("pending")).toBe(true);
    expect(excludesFromMeetExport("committed")).toBe(false);
    expect(blocksMeetEntryForAttendance("not_going")).toBe(true);
    expect(excludesFromMeetExport("not_going")).toBe(true);
    expect(blocksMeetEntryForAttendance("not_eligible")).toBe(true);
    expect(excludesFromMeetExport("not_eligible")).toBe(true);
    expect(excludesFromMeetExport(undefined)).toBe(false);
  });

  it("indexes commitments for lineup filtering", () => {
    const maps = indexMeetCommitments([
      { membershipId: "a", status: "pending" },
      { membershipId: "b", status: "declined" },
      { membershipId: "c", status: "not_eligible" },
      { membershipId: "d", status: "committed" },
    ]);
    expect(maps.pendingIds.has("a")).toBe(true);
    expect(maps.notGoingIds.has("b")).toBe(true);
    expect(maps.meetNotEligibleIds.has("c")).toBe(true);
    expect(indexMeetCommitments(undefined)).toEqual({
      pendingIds: new Set(),
      notGoingIds: new Set(),
      meetNotEligibleIds: new Set(),
    });
  });

  it("lists pending swimmers skipped on export", () => {
    expect(
      listPendingExportExclusions([
        {
          membershipId: "m1",
          status: "pending",
          firstName: "Pat",
          lastName: "Lee",
        },
        {
          membershipId: "m2",
          status: "pending",
          firstName: "Alex",
          lastName: "Zed",
        },
        {
          membershipId: "m3",
          status: "not_going",
          firstName: "Sam",
          lastName: "Kim",
        },
      ]),
    ).toEqual(["Alex Zed", "Pat Lee"]);
  });

  it("treats stored committed rows as committed UI status", () => {
    expect(resolveMeetAttendanceUiStatus("committed")).toBe("committed");
    expect(resolveMeetAttendanceUiStatus("unknown")).toBe("committed");
  });

  it("falls back to membership id when pending row has no name", () => {
    expect(
      listPendingExportExclusions([{ membershipId: "m9", status: "pending" }]),
    ).toEqual(["m9"]);
  });
});
