import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  detectRosterFileFormat,
  parseRosterFile,
  parseRosterFileFromBytes,
  rosterImportErrorForFile,
} from "../../src/roster/parser";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("detectRosterFileFormat", () => {
  it("detects by extension", () => {
    expect(detectRosterFileFormat("team.csv")).toBe("csv");
    expect(detectRosterFileFormat("team.sd3")).toBe("sdif");
    expect(detectRosterFileFormat("team.hy3")).toBe("hy3");
    expect(detectRosterFileFormat("team.cl2")).toBe("cl2");
  });

  it("sniffs HY3 roster content", () => {
    const hy3 = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    expect(detectRosterFileFormat("upload.txt", hy3)).toBe("hy3");
    expect(
      detectRosterFileFormat(
        "upload.txt",
        "A103Rosters Only             Hy-Tek",
      ),
    ).toBe("hy3");
    expect(
      detectRosterFileFormat("upload.txt", "D1M   21Smith               John"),
    ).toBe("hy3");
  });

  it("sniffs CL2 roster content", () => {
    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    expect(detectRosterFileFormat("upload.txt", cl2)).toBe("cl2");
    expect(
      detectRosterFileFormat("upload.txt", "A01V3      20Swimmers Only"),
    ).toBe("cl2");
  });

  it("returns null for meet event files and unknown content", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    expect(detectRosterFileFormat("events.ev3", ev3)).toBeNull();
    expect(detectRosterFileFormat("events.ev3")).toBeNull();
    expect(detectRosterFileFormat("notes.txt", "hello world")).toBeNull();
    expect(detectRosterFileFormat("notes.txt")).toBeNull();
    expect(detectRosterFileFormat("x.ev3")).toBeNull();
    expect(detectRosterFileFormat("x.hyv", "still not events")).toBeNull();
  });
});

describe("parseRosterFile", () => {
  it("parses each supported format", () => {
    const csv =
      "first_name,last_name,date_of_birth,gender\nAda,Lovelace,2012-04-15,female";
    expect(parseRosterFile(csv, "csv").length).toBe(1);

    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    expect(parseRosterFile(cl2, "cl2").length).toBeGreaterThan(5);
    expect(parseRosterFile(cl2, "sdif").length).toBeGreaterThan(5);

    const hy3 = readFileSync(join(fixturesDir, "roster-only.hy3"), "utf8");
    expect(parseRosterFile(hy3, "hy3").length).toBeGreaterThan(5);
  });

  it("returns empty array for unsupported roster format default branch", () => {
    expect(parseRosterFile("x", "hyv" as never)).toEqual([]);
  });
});

describe("rosterImportErrorForFile", () => {
  it("rejects meet event files", () => {
    const ev3 = readFileSync(join(fixturesDir, "sonoran-events.ev3"), "utf8");
    expect(rosterImportErrorForFile("events.ev3", ev3)).toMatch(
      /meet events file/,
    );
  });

  it("rejects unsupported files", () => {
    expect(rosterImportErrorForFile("notes.txt", "hello")).toMatch(
      /Unsupported file type/,
    );
  });

  it("returns null for valid roster files", () => {
    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    expect(rosterImportErrorForFile("roster.cl2", cl2)).toBeNull();
  });
});

describe("parseRosterFileFromBytes", () => {
  it("parses a single non-zip roster file", () => {
    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const bytes = new TextEncoder().encode(cl2);
    const rows = parseRosterFileFromBytes(bytes, "roster.cl2");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("rejects unsupported non-zip bytes", () => {
    const bytes = strToU8("not a roster");
    expect(() => parseRosterFileFromBytes(bytes, "notes.txt")).toThrow(
      /Unsupported file type/,
    );
  });

  it("parses swimmers from a roster ZIP and skips non-roster formats", () => {
    const cl2 = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const zip = zipSync({
      "roster.cl2": strToU8(cl2),
      "events.ev3": strToU8(
        "Meet;1/1/2025;1/2/2025;;Y;Pool\n1A;F;F;I;0;18;50;1",
      ),
    });
    const rows = parseRosterFileFromBytes(zip, "roster.zip");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("parses SDIF roster swimmers from a ZIP archive", () => {
    const sdif = readFileSync(join(fixturesDir, "roster-swimmers.cl2"), "utf8");
    const zip = zipSync({ "roster.sd3": strToU8(sdif) });
    const rows = parseRosterFileFromBytes(zip, "roster.zip");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("throws when a roster ZIP has no swimmer records", () => {
    const zip = zipSync({
      "events.ev3": strToU8(
        "Meet;1/1/2025;1/2/2025;;Y;Pool\n1A;F;F;I;0;18;50;1",
      ),
    });
    expect(() => parseRosterFileFromBytes(zip, "empty-roster.zip")).toThrow(
      /No roster swimmers found/,
    );
  });
});
