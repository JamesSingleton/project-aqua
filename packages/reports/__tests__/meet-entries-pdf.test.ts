import { buildMeetLineupSnapshot } from "@project-aqua/swim-core/meet-lineup-snapshot";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { buildMeetEntriesReport } from "../src/meet-entries/build";
import { MeetEntriesPdfDocument } from "../src/templates/pdf/meet-entries";

describe("MeetEntriesPdfDocument", () => {
  it("renders a non-empty PDF buffer", async () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "2026 Croswhite Invite",
        startDate: "2026-09-12",
        course: "SCY",
        location: "Chandler High School",
      },
      team: {
        name: "Maricopa High School",
        teamCode: "MARI",
        lscCode: "AZ",
      },
      events: [
        {
          id: "e7",
          eventNumber: 7,
          stroke: "free",
          distance: 50,
          gender: "male",
          eventKey: "50_free_scy_m",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e7",
          membershipId: "m1",
          seedTimeMs: 35_160,
          exhibition: false,
          status: "entered",
        },
      ],
      relayLegs: [],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Juan",
          lastName: "Trejo",
          gender: "male",
        },
      ],
    });
    const report = buildMeetEntriesReport(snapshot);

    const buffer = await renderToBuffer(MeetEntriesPdfDocument({ report }));
    expect(buffer.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);

  it("renders a swimmer-grouped PDF", async () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "Dual",
        startDate: "2026-09-12",
        course: "SCY",
        opponents: "Desert Ridge",
      },
      team: {
        name: "Maricopa High School",
        teamCode: "MARI",
      },
      events: [
        {
          id: "e7",
          eventNumber: 7,
          stroke: "free",
          distance: 50,
          gender: "male",
          eventKey: "50_free_scy_m",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e7",
          membershipId: "m1",
          seedTimeMs: 35_160,
          exhibition: false,
          status: "entered",
        },
      ],
      relayLegs: [],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Juan",
          lastName: "Trejo",
          gender: "male",
        },
      ],
    });
    const report = buildMeetEntriesReport(snapshot, { groupBy: "swimmer" });
    const buffer = await renderToBuffer(MeetEntriesPdfDocument({ report }));
    expect(buffer.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);
});
