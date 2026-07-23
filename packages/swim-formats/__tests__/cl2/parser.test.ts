import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { parseCl2Meet } from "../../src/cl2/parser";
import * as cl2Roster from "../../src/roster/cl2";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function cl2AthleteLine(
  type: "D0" | "G0",
  fields: {
    eventNumber: number;
    last: string;
    first: string;
    usa?: string;
    time?: string;
    place?: number;
  },
): string {
  let line = type + String(fields.eventNumber).padStart(4, "0");
  line = line.padEnd(11, " ");
  line += fields.last.padEnd(20, " ");
  line += fields.first.padEnd(20, " ");
  line += (fields.usa ?? "").padEnd(14, " ");
  line = line.padEnd(72, " ");
  line += (fields.time ?? "").padEnd(10, " ");
  if (type === "G0" && fields.place != null) {
    line += String(fields.place).padStart(4, "0");
  }
  return line;
}

describe("parseCl2Meet", () => {
  it("parses meet metadata and roster fallback from mari-entries.cl2", () => {
    const content = readFileSync(join(fixturesDir, "mari-entries.cl2"), "utf8");
    const meet = parseCl2Meet(content);

    expect(meet.name).toMatch(/2025 Sonoran Desert Invit/);
    expect(meet.location?.length).toBeGreaterThan(0);
    expect(meet.entries.length).toBeGreaterThan(5);
    expect(meet.entries[0]?.swimmerName).toMatch(/\S+\s+\S+/);
  });

  it("parses meet results title from azsi-results.cl2", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.cl2"), "utf8");
    const meet = parseCl2Meet(content);

    expect(meet.name).toMatch(/AZSI 2025 Short Course Regiona/);
    expect(meet.results.length).toBeGreaterThan(0);
  });

  it("detects A0 file type labels and custom title", () => {
    const entries = parseCl2Meet(
      "A01V3      02Meet Entries                  Hy-Tek\nB11        Custom Meet Title                         Pool Name",
    );
    expect(entries.name).toBe("Custom Meet Title");
    expect(entries.location).toBe("Pool Name");

    const results = parseCl2Meet(
      "A01V3      02Meet Results                  ".padEnd(73, " "),
    );
    expect(results.name).toBe("Meet Results");
  });

  it("parses D0/D1 entry and G0/F0 result lines", () => {
    const content = [
      "A01V3      02Meet Entries                  Hy-Tek",
      cl2AthleteLine("D0", {
        eventNumber: 11,
        last: "Lovelace",
        first: "Ada",
        usa: "ABCD1234567890",
        time: "1:05.00",
      }),
      cl2AthleteLine("G0", {
        eventNumber: 11,
        last: "Smith",
        first: "Bob",
        time: "1:04.00",
        place: 2,
      }),
      cl2AthleteLine("G0", {
        eventNumber: 12,
        last: "Jones",
        first: "Pat",
        time: "NS",
        place: 0,
      }),
    ].join("\n");

    const meet = parseCl2Meet(content);
    expect(meet.entries[0]).toMatchObject({
      eventNumber: 11,
      swimmerName: "Ada Lovelace",
      usaMemberId: "ABCD1234567890",
      seedTime: "1:05.00",
    });
    expect(meet.results[0]).toMatchObject({
      eventNumber: 11,
      swimmerName: "Bob Smith",
      time: "1:04.00",
      place: 2,
      isDq: false,
    });
    expect(
      meet.results.find((r) => r.swimmerName.includes("Pat")),
    ).toMatchObject({
      isDq: true,
    });
  });

  it("marks DQ/NS/SCR on result lines", () => {
    const content = cl2AthleteLine("G0", {
      eventNumber: 11,
      last: "Doe",
      first: "Jane",
      time: "DQ",
      place: 1,
    });
    const meet = parseCl2Meet(content);
    expect(meet.results[0]?.isDq).toBe(true);
  });

  it("falls back to roster extraction when no athlete lines match", () => {
    vi.spyOn(cl2Roster, "parseCl2Roster").mockReturnValue([
      {
        firstName: "Ada",
        lastName: "Lovelace",
        dateOfBirth: "2012-04-15",
        gender: "female",
        usaMemberId: "USA123",
      },
    ]);

    const meet = parseCl2Meet(
      "A01V3      02Meet Entries                  Hy-Tek",
    );
    expect(meet.entries).toEqual([
      { swimmerName: "Ada Lovelace", usaMemberId: "USA123" },
    ]);

    vi.restoreAllMocks();
  });

  it("uses roster-style CL2 for swimmer-only files", () => {
    const content = readFileSync(
      join(fixturesDir, "roster-swimmers.cl2"),
      "utf8",
    );
    const meet = parseCl2Meet(content);
    expect(meet.entries.length).toBeGreaterThan(5);
    expect(meet.entries[0]?.swimmerName).toMatch(/\S+\s+\S+/);
  });

  it("covers empty B1 fields and blank athlete name/event fallbacks", () => {
    const blankB1 = parseCl2Meet(
      "A01V3      02Meet Entries                  \nB11                                                                                          ",
    );
    expect(blankB1.name).toBe("Meet Entries");
    expect(blankB1.location).toBeUndefined();

    const blankAthlete = [
      "D0    " + " ".repeat(100),
      "F0    " + " ".repeat(70) + "1:00.00",
      "G0    " + " ".repeat(70),
    ].join("\n");
    const meet = parseCl2Meet(blankAthlete);
    expect(meet.entries[0]?.eventNumber).toBeUndefined();
    expect(meet.entries[0]?.swimmerName).toBe("");
    expect(meet.results[0]?.eventNumber).toBeUndefined();
    expect(meet.results[0]?.swimmerName).toBe("");
    expect(meet.results).toHaveLength(1);
  });
});
