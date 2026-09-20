import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { buildTeamBestTimesReport } from "../src/team-best-times/build";
import { TeamBestTimesPdfDocument } from "../src/templates/pdf/team-best-times";

describe("TeamBestTimesPdfDocument", () => {
  it("renders a non-empty PDF buffer", async () => {
    const report = buildTeamBestTimesReport({
      teamName: "Aqua High",
      teamCode: "AQUA",
      times: [
        {
          swimmerId: "f1",
          swimmerName: "Ada Lovelace",
          gender: "female",
          eventKey: "50_free_scy_f",
          course: "SCY",
          timeMs: 26_500,
        },
        {
          swimmerId: "f2",
          swimmerName: "Grace Hopper",
          gender: "female",
          eventKey: "50_free_scy_f",
          course: "SCY",
          timeMs: 27_100,
        },
        {
          swimmerId: "f3",
          swimmerName: "Katherine Johnson",
          gender: "female",
          eventKey: "50_free_scy_f",
          course: "SCY",
          timeMs: 27_400,
        },
        {
          swimmerId: "f4",
          swimmerName: "Dorothy Vaughan",
          gender: "female",
          eventKey: "50_free_scy_f",
          course: "SCY",
          timeMs: 27_800,
        },
      ],
    });

    const buffer = await renderToBuffer(TeamBestTimesPdfDocument({ report }));
    expect(buffer.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(buffer.slice(0, 4)).toString()).toBe("%PDF");
  }, 30_000);
});
