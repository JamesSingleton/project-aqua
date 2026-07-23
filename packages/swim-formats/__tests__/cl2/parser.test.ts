import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { detectCl2FileKind, parseCl2Meet } from "../../src/cl2/parser";
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
  it("parses legacy CTCC meet results with D0-embedded times", () => {
    const content = readFileSync(
      join(fixturesDir, "ctcc-meet-results-2005.cl2"),
      "utf8",
    );
    expect(detectCl2FileKind(content)).toBe("meet_results");
    const meet = parseCl2Meet(content);
    expect(meet.name).toMatch(/CTCCvPDC/);
    expect(meet.startDate).toBe("2005-06-01");
    expect(meet.results.length).toBe(9);
    expect(meet.results[0]?.swimmerName).toMatch(/Will Burns/);
    expect(meet.results[0]?.time).toMatch(/38\.01/);
    expect(meet.results[0]?.dateOfBirth).toBe("1989-11-15");
    expect(meet.results[0]?.gender).toBe("male");
    expect(meet.results[0]?.teamCode).toMatch(/CTCC/i);
    expect(meet.events.length).toBeGreaterThan(0);
  });

  it("parses meet metadata and entries from mari-entries.cl2", () => {
    const content = readFileSync(join(fixturesDir, "mari-entries.cl2"), "utf8");
    const meet = parseCl2Meet(content);

    expect(meet.name).toMatch(/2025 Sonoran Desert Invit/);
    expect(meet.location?.length).toBeGreaterThan(0);
    expect(meet.entries.length).toBeGreaterThan(5);
    expect(meet.entries[0]?.swimmerName).toMatch(/\S+\s+\S+/);
    expect(meet.results.length).toBe(0);
    expect(meet.relays?.length).toBeGreaterThan(0);
  });

  it("parses modern azsi results via G0 lines", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.cl2"), "utf8");
    const meet = parseCl2Meet(content);

    expect(meet.name).toMatch(/AZSI 2025 Short Course Regiona/);
    expect(meet.results.length).toBeGreaterThan(0);
    expect(meet.entries.length).toBeGreaterThan(0);
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
    expect(results.importKind).toBe("results");
    expect(entries.importKind).toBe("entries");
  });

  it("parses D0 entry and G0 result lines (dual-column names)", () => {
    const content = [
      "A01V3      02Meet Results                  Hy-Tek",
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
    expect(meet.entries.some((e) => e.swimmerName.includes("Ada"))).toBe(true);
    expect(meet.results[0]).toMatchObject({
      swimmerName: "Bob Smith",
      time: "1:04.00",
      isDq: false,
    });
    expect(
      meet.results.find((r) => r.swimmerName.includes("Pat")),
    ).toMatchObject({
      isDq: true,
    });
  });

  it("marks DQ/NS/SCR on result lines", () => {
    const content = [
      "A01V3      02Meet Results                  Hy-Tek",
      cl2AthleteLine("G0", {
        eventNumber: 11,
        last: "Doe",
        first: "Jane",
        time: "DQ",
        place: 1,
      }),
    ].join("\n");
    const meet = parseCl2Meet(content);
    expect(meet.results[0]?.isDq).toBe(true);
  });

  it("falls back to roster extraction when Meet Entries has no athlete lines", () => {
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

  it("does not invent meet rows for Swimmers Only files", () => {
    const content = readFileSync(
      join(fixturesDir, "roster-swimmers.cl2"),
      "utf8",
    );
    expect(detectCl2FileKind(content)).toBe("swimmers_only");
    const meet = parseCl2Meet(content);
    expect(meet.entries).toEqual([]);
    expect(meet.results).toEqual([]);
  });

  it("treats F0 as relay legs, not results", () => {
    const content = readFileSync(join(fixturesDir, "ctcc-entries.cl2"), "utf8");
    const meet = parseCl2Meet(content);
    expect(meet.results.length).toBe(0);
    expect(meet.relays?.length).toBeGreaterThan(0);
    expect(meet.relays?.[0]?.swimmerNames.length).toBeGreaterThan(0);
  });
});
