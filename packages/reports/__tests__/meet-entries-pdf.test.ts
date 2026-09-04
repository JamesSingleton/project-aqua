import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { buildMeetEntriesReport } from "../src/meet-entries/build";
import { MeetEntriesPdfDocument } from "../src/templates/pdf/meet-entries";

describe("MeetEntriesPdfDocument", () => {
  it("renders a non-empty PDF buffer", async () => {
    const report = buildMeetEntriesReport({
      meetName: "2026 Croswhite Invite",
      startDate: "2026-09-12",
      course: "SCY",
      location: "Chandler High School",
      teamName: "Maricopa High School",
      teamCode: "MARI-AZ",
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
          firstName: "Juan",
          lastName: "Trejo",
          seedTimeMs: 35_160,
          exhibition: false,
          status: "entered",
          stroke: "free",
          eventKey: "50_free_scy_m",
          gender: "male",
        },
      ],
      relayLegs: [],
    });

    const buffer = await renderToBuffer(MeetEntriesPdfDocument({ report }));
    expect(buffer.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);
});
