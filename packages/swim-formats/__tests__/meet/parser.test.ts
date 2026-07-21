import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  detectMeetFileFormat,
  parseMeetFile,
  parseMeetFileFromBytes,
} from "../../src/meet/parser";

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

function makeEventXls(rows: unknown[][], bookType: XLSX.BookType = "xlsx"): Uint8Array {
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

  it("throws for XLS text path and unsupported format", () => {
    expect(() => parseMeetFile("x", "xls")).toThrow(/binary input/);
    expect(() => parseMeetFile("x", "unknown" as never)).toThrow(
      /Unsupported meet format/,
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
