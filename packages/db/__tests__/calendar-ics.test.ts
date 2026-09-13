import { describe, expect, it } from "vitest";
import { buildIcsCalendar } from "../src/calendar-ics";

const baseEvent = {
  id: "evt-1",
  source: "custom" as const,
  title: "Practice; AM, swim\nsets",
  location: "Pool; A, lane 1",
  description: " Bring suits\\gear ",
  startsAt: new Date("2026-08-10T12:00:00.000Z"),
  endsAt: null as Date | null,
  eventType: "practice" as const,
  meetId: null as string | null,
  practiceSessionId: null as string | null,
  aquaVersion: 1,
};

describe("buildIcsCalendar", () => {
  it("builds a calendar with default 1h end and escaping", () => {
    const ics = buildIcsCalendar("Team; Aqua, Coaches\nA", [baseEvent]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("X-WR-CALNAME:Team\\; Aqua\\, Coaches\\nA");
    expect(ics).toContain("SUMMARY:Practice\\; AM\\, swim\\nsets");
    expect(ics).toContain("LOCATION:Pool\\; A\\, lane 1");
    expect(ics).toContain("DESCRIPTION:Bring suits\\\\gear");
    expect(ics).toContain("DTSTART:20260810T120000Z");
    expect(ics).toContain("DTEND:20260810T130000Z");
    expect(ics).toContain("CATEGORIES:PRACTICE");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics.includes("\r\n")).toBe(true);
  });

  it("uses explicit endsAt and omits empty optional fields", () => {
    const ics = buildIcsCalendar("Team", [
      {
        ...baseEvent,
        id: "meet-1",
        title: "Invite",
        startsAt: new Date("2026-08-11T15:00:00.000Z"),
        endsAt: new Date("2026-08-11T17:30:00.000Z"),
        eventType: "meet",
        location: null,
        description: "   ",
      },
    ]);

    expect(ics).toContain("DTEND:20260811T173000Z");
    expect(ics).not.toContain("LOCATION:");
    expect(ics).not.toContain("DESCRIPTION:");
    expect(ics).toContain("CATEGORIES:MEET");
  });
});
