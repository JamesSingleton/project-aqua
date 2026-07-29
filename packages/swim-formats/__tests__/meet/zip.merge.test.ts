import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  extractAllMeetFilesFromZip,
  mergeParsedMeets,
  selectPrimaryMeetFile,
  type ExtractedMeetFile,
} from "../../src/meet/zip";
import type { ParsedMeet } from "../../src/types";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function file(
  filename: string,
  content: string,
  format: ExtractedMeetFile["format"],
  depth = 0,
): ExtractedMeetFile {
  return {
    filename,
    bytes: strToU8(content),
    format,
    depth,
  };
}

describe("selectPrimaryMeetFile", () => {
  it("flags roster-only top-level packs and keeps top-level roster files", () => {
    const rosterCl2 = readFileSync(
      join(fixturesDir, "roster-swimmers.cl2"),
      "utf8",
    );
    const files = [file("roster.cl2", rosterCl2, "cl2", 0)];
    const { primary, isRosterOnly } = selectPrimaryMeetFile(files);
    expect(isRosterOnly).toBe(true);
    expect(primary.filename).toBe("roster.cl2");
  });

  it("treats nested meet files as non-roster when top-level has meet content", () => {
    const entries = readFileSync(join(fixturesDir, "mari-entries.cl2"), "utf8");
    const roster = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const files = [
      file("entries.cl2", entries, "cl2", 0),
      file("nested/roster.cl2", roster, "cl2", 1),
    ];
    const { primary, isRosterOnly } = selectPrimaryMeetFile(files);
    expect(isRosterOnly).toBe(false);
    expect(primary.filename).toBe("entries.cl2");
  });
});

describe("extractAllMeetFilesFromZip extras", () => {
  it("deduplicates repeated files and unpacks nested zips", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    const inner = zipSync({ "inner.ev3": strToU8(ev3) });
    const outer = zipSync({
      "meet.ev3": strToU8(ev3),
      "dup.ev3": strToU8(ev3),
      "nested.zip": inner,
    });
    const bundle = extractAllMeetFilesFromZip(outer, { maxDepth: 2 });
    expect(bundle.files.length).toBe(3);
    expect(bundle.files.some((f) => f.filename === "inner.ev3")).toBe(true);
    expect(bundle.primary.format).toBe("ev3");
  });

  it("detects roster-only HY3 and SDIF top-level archives", () => {
    const hy3 = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    const hy3Bundle = extractAllMeetFilesFromZip(
      zipSync({ "roster.hy3": strToU8(hy3) }),
    );
    expect(hy3Bundle.isRosterOnly).toBe(true);

    const sdifRoster = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const sdifBundle = extractAllMeetFilesFromZip(
      zipSync({ "roster.sd3": strToU8(sdifRoster) }),
    );
    expect(sdifBundle.isRosterOnly).toBe(true);
  });

  it("falls back to the full file list when the filtered meet pool is empty", () => {
    const roster = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const { primary } = selectPrimaryMeetFile([
      file("nested/roster.cl2", roster, "cl2", 1),
    ]);
    expect(primary.filename).toBe("nested/roster.cl2");
  });

  it("falls back to the first file when no ranked format matches", () => {
    const unknown = file("notes.txt", "hello", "xls" as ExtractedMeetFile["format"]);
    const { primary } = selectPrimaryMeetFile([
      { ...unknown, format: "bogus" as ExtractedMeetFile["format"] },
    ]);
    expect(primary.filename).toBe("notes.txt");
  });

  it("skips duplicate extracted files with the same depth, format, and name", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    const bytes = zipSync({
      "meet.ev3": strToU8(ev3),
      "folder/meet.ev3": strToU8(ev3),
    });
    const bundle = extractAllMeetFilesFromZip(bytes);
    expect(bundle.files).toHaveLength(1);
  });

  it("does not unpack nested archives when maxDepth is zero", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    const inner = zipSync({ "inner.ev3": strToU8(ev3) });
    const outer = zipSync({ "nested.zip": inner });
    expect(() => extractAllMeetFilesFromZip(outer, { maxDepth: 0 })).toThrow(
      /doesn't contain a supported meet file/,
    );
  });
});

describe("mergeParsedMeets", () => {
  const primary: ParsedMeet = {
    name: "Primary",
    course: "SCY",
    events: [
      {
        eventNumber: 1,
        distance: 50,
        stroke: "free",
        gender: "female",
        eventKey: "e1",
      },
    ],
    entries: [
      {
        eventNumber: 1,
        swimmerName: "Ada Lovelace",
        seedTime: undefined,
      },
    ],
    results: [
      {
        eventNumber: 1,
        swimmerName: "Ada Lovelace",
        time: "28.00",
      },
    ],
    relays: [],
    importKind: "entries",
  };

  const supplement: ParsedMeet = {
    name: "Supplement",
    course: "SCY",
    startDate: "2025-01-01",
    endDate: "2025-01-02",
    location: "Away Pool",
    address: "123 Lane",
    entryDeadline: "2024-12-31",
    entryLimits: { maxIndividual: 3 },
    skippedDiveEvents: 2,
    events: [
      {
        eventNumber: 2,
        distance: 100,
        stroke: "back",
        gender: "male",
        eventKey: "e2",
      },
    ],
    entries: [
      {
        eventNumber: 1,
        swimmerName: "Ada Lovelace",
        usaMemberId: "USA123",
        seedTime: "29.00",
      },
      {
        eventNumber: 2,
        swimmerName: "Bob Smith",
        seedTime: "1:05.00",
      },
    ],
    results: [
      {
        eventNumber: 1,
        swimmerName: "Ada Lovelace",
        time: "27.50",
      },
      {
        eventNumber: 2,
        swimmerName: "Bob Smith",
        time: "1:04.00",
      },
    ],
    relays: [
      {
        eventNumber: 10,
        swimmerNames: ["A", "B", "C", "D"],
        seedTime: "1:40.00",
      },
    ],
    importKind: "results",
  };

  it("fills missing metadata, merges unique rows, and backfills duplicate entries", () => {
    const merged = mergeParsedMeets(primary, [supplement]);
    expect(merged.name).toBe("Primary");
    expect(merged.startDate).toBe("2025-01-01");
    expect(merged.endDate).toBe("2025-01-02");
    expect(merged.location).toBe("Away Pool");
    expect(merged.address).toBe("123 Lane");
    expect(merged.entryDeadline).toBe("2024-12-31");
    expect(merged.entryLimits).toEqual({ maxIndividual: 3 });
    expect(merged.skippedDiveEvents).toBe(2);
    expect(merged.events).toHaveLength(2);
    expect(merged.entries).toHaveLength(2);
    expect(merged.results).toHaveLength(2);
    expect(merged.relays).toHaveLength(1);
    expect(merged.importKind).toBe("results");

    const ada = merged.entries.find((e) => e.swimmerName === "Ada Lovelace");
    expect(ada).toMatchObject({
      usaMemberId: "USA123",
      seedTime: "29.00",
    });
  });

  it("keeps primary importKind when supplement is only entries", () => {
    const merged = mergeParsedMeets(
      { ...primary, importKind: undefined },
      [{ ...supplement, importKind: "entries" }],
    );
    expect(merged.importKind).toBe("entries");
  });

  it("skips metadata already present on the primary meet and appends relays", () => {
    const merged = mergeParsedMeets(
      {
        ...primary,
        endDate: "2025-06-01",
        entryLimits: { maxIndividual: 5 },
        skippedDiveEvents: 1,
        relays: [
          {
            eventNumber: 9,
            swimmerNames: ["One"],
            seedTime: "1:30.00",
          },
        ],
      },
      [supplement],
    );
    expect(merged.endDate).toBe("2025-06-01");
    expect(merged.entryLimits).toEqual({ maxIndividual: 5 });
    expect(merged.skippedDiveEvents).toBe(1);
    expect(merged.relays).toHaveLength(2);
  });

  it("starts with undefined relays when the primary meet has none", () => {
    const merged = mergeParsedMeets(
      { ...primary, relays: undefined },
      [supplement],
    );
    expect(merged.relays).toHaveLength(1);
  });

  it("indexes entries and results that omit an event number", () => {
    const merged = mergeParsedMeets(primary, [
      {
        ...supplement,
        entries: [{ swimmerName: "No Event Swimmer", seedTime: "30.00" }],
        results: [{ swimmerName: "No Event Swimmer", time: "29.00" }],
      },
    ]);
    expect(
      merged.entries.some((e) => e.swimmerName === "No Event Swimmer"),
    ).toBe(true);
    expect(
      merged.results.some((r) => r.swimmerName === "No Event Swimmer"),
    ).toBe(true);
  });
});
