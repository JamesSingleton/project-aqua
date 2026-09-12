import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import {
  detectMeetFileFormat,
  parseMeetFile,
  parseMeetFileFromBytes,
  parseMeetFilesFromBytes,
} from "../../src/meet/parser";
import * as zipModule from "../../src/meet/zip";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function zipOf(files: Record<string, string>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    entries[name] = strToU8(content);
  }
  return zipSync(entries);
}

function makeEventXls(
  rows: unknown[][],
  bookType: XLSX.BookType = "xlsx",
): Uint8Array {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Results");
  return new Uint8Array(XLSX.write(wb, { type: "buffer", bookType }));
}

describe("detectMeetFileFormat", () => {
  it("detects by file extension", () => {
    expect(detectMeetFileFormat("meet.ev3")).toBe("ev3");
    expect(detectMeetFileFormat("meet.hyv")).toBe("hyv");
    expect(detectMeetFileFormat("meet.hy3")).toBe("hy3");
    expect(detectMeetFileFormat("meet.sd3")).toBe("sdif");
    expect(detectMeetFileFormat("meet.sdif")).toBe("sdif");
    expect(detectMeetFileFormat("meet.cl2")).toBe("cl2");
    expect(detectMeetFileFormat("report.xls")).toBe("xls");
    expect(detectMeetFileFormat("report.xlsx")).toBe("xls");
    expect(detectMeetFileFormat("notes.txt")).toBeNull();
  });

  it("sniffs content when extension is ambiguous", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    expect(detectMeetFileFormat("upload.dat", ev3)).toBe("ev3");

    const hy3 = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    expect(detectMeetFileFormat("upload.dat", hy3)).toBe("hy3");

    const sdifHead = "A0V3 SDIF Meet Manager\nB1Test Meet";
    expect(detectMeetFileFormat("upload.dat", sdifHead)).toBe("sdif");

    const cl2Head = "A01V3      02Meet Entries                  Hy-Tek";
    expect(detectMeetFileFormat("upload.dat", cl2Head)).toBe("cl2");

    expect(detectMeetFileFormat("upload.dat", "random text")).toBeNull();
    expect(detectMeetFileFormat("upload.dat")).toBeNull();
  });
});

describe("parseMeetFile", () => {
  it("parses each text-based meet format", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    expect(parseMeetFile(ev3, "ev3").events.length).toBe(22);

    const hyv = readFileSync(join(fixturesDir, "azsi-events.hyv"), "utf8");
    expect(parseMeetFile(hyv, "hyv").events.length).toBeGreaterThan(0);

    const hy3 = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    expect(parseMeetFile(hy3, "hy3").entries.length).toBeGreaterThan(0);

    const cl2 = readFileSync(join(fixturesDir, "mari-entries.cl2"), "utf8");
    expect(parseMeetFile(cl2, "cl2").entries.length).toBeGreaterThan(0);

    const sd3 = readFileSync(
      join(fixturesDir, "AZAZSL_ext7716201449890453768.sd3"),
    ).toString("utf8");
    expect(parseMeetFile(sd3, "sdif").entries.length).toBeGreaterThan(0);
  });

  it("lists imported events in numerical order", () => {
    const meet = parseMeetFile(
      [
        "A01V3      02Meet Entries                  Hy-Tek",
        "D01AZ  JR  McNamee, Marlie                                       FF 1001 11 UNOV         1:16.69Y",
        "D01AZ  FR  Horner, Liem                                          MM  501  8 UNOV           51.43Y",
      ].join("\n"),
      "cl2",
    );
    expect(meet.events.map((e) => e.eventNumber)).toEqual([8, 11]);

    const hy3 = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    const numbers = parseMeetFile(hy3, "hy3")
      .events.map((e) => e.eventNumber)
      .filter((n): n is number => n != null);
    expect(numbers).toEqual([...numbers].toSorted((a, b) => a - b));
  });

  it("throws for XLS text path and unsupported format", () => {
    expect(() => parseMeetFile("x", "xls")).toThrow(/binary input/);
    expect(() => parseMeetFile("x", "unknown" as never)).toThrow(
      /Unsupported meet format/,
    );
  });

  it("hard-fails Rosters Only HY3 on the meet import path", () => {
    const hy3 = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    expect(() => parseMeetFile(hy3, "hy3")).toThrow(/Rosters Only/);
    const bytes = new TextEncoder().encode(hy3);
    expect(() => parseMeetFileFromBytes(bytes, "roster-only.hy3")).toThrow(
      /Rosters Only/,
    );
  });
});

describe("parseMeetFileFromBytes", () => {
  it("extracts and parses EV3 from zip archives", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"), "utf8");
    const bytes = zipOf({ "meet.ev3": ev3 });
    const meet = parseMeetFileFromBytes(bytes, "meet.zip");
    expect(meet.name).toMatch(/Charger/);
  });

  it("prefers HYV over EV3 when merging a zip pack", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"), "utf8");
    const hyv = readFileSync(join(fixturesDir, "charger-events.hyv"), "utf8");
    const bytes = zipSync({
      "meet.ev3": strToU8(ev3),
      "meet.hyv": strToU8(hyv),
    });
    const meet = parseMeetFileFromBytes(bytes, "charger.zip");
    expect(meet.name).toMatch(/Charger/);
    expect(meet.events.length).toBeGreaterThan(0);
  });

  it("skips EV3 supplements when HYV is the selected primary file", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    const hyv = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    const bytes = zipSync({
      "meet.ev3": strToU8(ev3),
      "meet.hyv": strToU8(hyv),
    });
    vi.spyOn(zipModule, "selectPrimaryMeetFile").mockReturnValue({
      primary: {
        filename: "meet.hyv",
        bytes: strToU8(hyv),
        format: "hyv",
        depth: 0,
      },
      isRosterOnly: false,
    });
    const meet = parseMeetFileFromBytes(bytes, "pack.zip");
    vi.restoreAllMocks();
    expect(meet.events.length).toBe(22);
  });

  it("parses legacy XLS event exports from bytes", () => {
    const rows = [
      ["ignored"],
      ["100 Free Finals"],
      [
        "name",
        "age",
        "team",
        "seed time",
        "x",
        "x",
        "prelim time",
        "x",
        "x",
        "finals time",
        "x",
        "x",
        "pad",
        "pad2",
      ],
      [
        "1",
        "Jane Doe",
        "16",
        "TST",
        "30.00",
        "",
        "",
        "",
        "",
        "29.50",
        "",
        "",
        "",
        "",
        "29.00",
        "",
        "",
        "",
        "",
      ],
    ];
    const bytes = makeEventXls(rows, "biff8");
    const meet = parseMeetFileFromBytes(bytes, "event.xls");
    expect(meet.name).toBe("100 Free Finals");
    expect(meet.results[0]).toMatchObject({
      swimmerName: "Jane Doe",
      place: 1,
    });
  });

  it("parses XLS meet reports extracted from a ZIP archive", () => {
    const rows = [
      ["ignored"],
      ["50 Free Finals"],
      [
        "name",
        "age",
        "team",
        "seed time",
        "x",
        "x",
        "prelim time",
        "x",
        "x",
        "finals time",
        "x",
        "x",
        "pad",
        "pad2",
      ],
      [
        "1",
        "Zip Swimmer",
        "15",
        "TST",
        "25.00",
        "",
        "",
        "",
        "",
        "24.50",
        "",
        "",
        "",
        "",
        "24.00",
        "",
        "",
        "",
        "",
      ],
    ];
    const xlsBytes = makeEventXls(rows, "biff8");
    const zipBytes = zipSync({ "results.xls": xlsBytes });
    const meet = parseMeetFileFromBytes(zipBytes, "meet-pack.zip");
    expect(meet.name).toBe("50 Free Finals");
    expect(meet.results[0]?.swimmerName).toBe("Zip Swimmer");
  });

  it("parses sdif from bytes", () => {
    const sd3 = readFileSync(
      join(fixturesDir, "AZAZSL_ext7716201449890453768.sd3"),
    );
    const meet = parseMeetFileFromBytes(sd3, "meet.sd3");
    expect(meet.entries.length).toBeGreaterThan(0);
  });

  it("rejects unsupported bytes", () => {
    const bytes = strToU8("not a meet file");
    expect(() => parseMeetFileFromBytes(bytes, "notes.txt")).toThrow(
      /Unsupported meet file/,
    );
  });
});

describe("parseMeetFilesFromBytes", () => {
  it("delegates a single file to parseMeetFileFromBytes", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"));
    const meet = parseMeetFilesFromBytes([
      { filename: "meet.ev3", bytes: new Uint8Array(ev3) },
    ]);
    expect(meet.events.length).toBe(22);
  });

  it("merges companion HFILE+CFILE pairs without zipping them first", () => {
    const cl2 = readFileSync(join(fixturesDir, "mari-entries.cl2"));
    const hy3 = readFileSync(join(fixturesDir, "mari-entries.hy3"));
    const merged = parseMeetFilesFromBytes([
      { filename: "mari-entries.cl2", bytes: new Uint8Array(cl2) },
      { filename: "mari-entries.hy3", bytes: new Uint8Array(hy3) },
    ]) as ReturnType<typeof parseMeetFileFromBytes> & {
      sourceFiles?: string[];
    };
    expect(merged.entries.length).toBeGreaterThan(0);
    expect(merged.sourceFiles).toEqual([
      "mari-entries.cl2",
      "mari-entries.hy3",
    ]);
    const relayNames = merged.relays?.flatMap((r) => r.swimmerNames) ?? [];
    expect(relayNames.some((name) => /MARIA/i.test(name))).toBe(false);
    expect(relayNames).toContain("Marlie McNamee");
  });

  it("rejects mixing a ZIP with other files", () => {
    const zipBytes = zipOf({ "meet.ev3": "A102Meet Entries" });
    expect(() =>
      parseMeetFilesFromBytes([
        { filename: "pack.zip", bytes: zipBytes },
        { filename: "extra.cl2", bytes: strToU8("A01V3      02Meet Entries") },
      ]),
    ).toThrow(/not both together/);
  });

  it("rejects an unsupported file in a multi-file selection", () => {
    const cl2 = readFileSync(join(fixturesDir, "mari-entries.cl2"));
    expect(() =>
      parseMeetFilesFromBytes([
        { filename: "mari-entries.cl2", bytes: new Uint8Array(cl2) },
        { filename: "notes.txt", bytes: strToU8("not a meet file") },
      ]),
    ).toThrow(/isn't a supported meet file/);
  });

  it("rejects an empty selection", () => {
    expect(() => parseMeetFilesFromBytes([])).toThrow(/Select at least one/);
  });
});
