import { buildMeetLineupSnapshot } from "@project-aqua/swim-core/meet-lineup-snapshot";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { buildSplitSheetReport } from "../src/split-sheet/build";
import { SplitSheetPdfDocument } from "../src/templates/pdf/split-sheet";

describe("SplitSheetPdfDocument", () => {
  it("renders a portrait PDF for a 50 free", async () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "2026 Croswhite Invite",
        startDate: "2026-09-12",
        course: "SCY",
      },
      team: { name: "Maricopa High School", teamCode: "MARI" },
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
    const report = buildSplitSheetReport(snapshot);
    const buffer = await renderToBuffer(SplitSheetPdfDocument({ report }));
    expect(buffer.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);

  it("renders a landscape PDF for 500 free and a swimmer grouping", async () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "Dual",
        startDate: "2026-09-12",
        course: "SCY",
        opponents: "Desert Ridge",
      },
      team: { name: "Maricopa High School" },
      events: [
        {
          id: "e21",
          eventNumber: 21,
          stroke: "free",
          distance: 500,
          gender: "female",
          eventKey: "500_free_scy_f",
        },
        {
          id: "e1",
          eventNumber: 1,
          stroke: "free_relay",
          distance: 200,
          gender: "female",
          eventKey: "200_free_relay_scy_f",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e21",
          membershipId: "m1",
          seedTimeMs: 320_000,
          exhibition: true,
          status: "entered",
        },
      ],
      relayLegs: [
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m1",
        },
      ],
      relayTeams: [{ meetEventId: "e1", relayLetter: "A", seedTimeMs: null }],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Riley",
          lastName: "Cain",
          gender: "female",
        },
      ],
    });
    const landscape = buildSplitSheetReport(snapshot);
    expect(landscape.pageOrientation).toBe("landscape");
    const buffer = await renderToBuffer(
      SplitSheetPdfDocument({ report: landscape }),
    );
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");

    const bySwimmer = buildSplitSheetReport(snapshot, { groupBy: "swimmer" });
    const swimmerBuffer = await renderToBuffer(
      SplitSheetPdfDocument({ report: bySwimmer }),
    );
    expect(Buffer.from(swimmerBuffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);
});
