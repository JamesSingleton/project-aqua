import {
  formatBestTimeAchievedLabel,
  snapshotBestTimeMeetName,
} from "@project-aqua/swim-core/calendar-date";
import { describe, expect, it } from "vitest";

describe("org-scope progression helpers", () => {
  it("keeps global PR meet names without a live meet join", () => {
    const date = new Date("2026-03-12T00:00:00.000Z");
    expect(
      formatBestTimeAchievedLabel(
        date,
        "State Championships",
        () => "Mar 12, 2026",
      ),
    ).toBe("State Championships · Mar 12, 2026");
    expect(
      snapshotBestTimeMeetName({
        nextMeetId: "club-meet",
        resolvedName: null,
        existing: { meetId: "club-meet", meetName: "Winter Invite" },
      }),
    ).toBe("Winter Invite");
  });
});
