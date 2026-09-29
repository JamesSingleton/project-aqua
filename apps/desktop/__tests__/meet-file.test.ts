import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  basename,
  hasMeetFileExtension,
  inspectFiles,
  type SourceFile,
} from "../src/lib/meet-file";

const fixtures = fileURLToPath(
  new URL("../../../packages/swim-formats/fixtures/", import.meta.url),
);

function fixture(filename: string): SourceFile {
  return {
    filename,
    bytes: new Uint8Array(readFileSync(`${fixtures}${filename}`)),
  };
}

describe("hasMeetFileExtension", () => {
  it("accepts meet extensions case-insensitively", () => {
    expect(hasMeetFileExtension("MEET.HY3")).toBe(true);
    expect(hasMeetFileExtension("pack.zip")).toBe(true);
  });

  it("rejects other files", () => {
    expect(hasMeetFileExtension("notes.txt")).toBe(false);
    expect(hasMeetFileExtension("noext")).toBe(false);
  });
});

describe("basename", () => {
  it("handles macOS and Windows paths", () => {
    expect(basename("/Users/coach/Meets/results.hy3")).toBe("results.hy3");
    expect(basename("C:\\Users\\coach\\My Meets\\pack.zip")).toBe("pack.zip");
    expect(basename("plain.cl2")).toBe("plain.cl2");
  });
});

describe("inspectFiles", () => {
  it("summarizes a results HY3", () => {
    const inspected = inspectFiles([fixture("azsi-results.hy3")]);
    expect(inspected.kind).toBe("meet");
    if (inspected.kind !== "meet") return;
    expect(inspected.summary.results).toBeGreaterThan(0);
    expect(inspected.summary.results).toBe(inspected.meet.results.length);
    expect(inspected.summary.athletes).toBeGreaterThan(0);
    expect(inspected.sourceFiles).toEqual(["azsi-results.hy3"]);
  });

  it("merges a ZIP entry pack and lists its source files", () => {
    const inspected = inspectFiles([fixture("ctcc-entries.zip")]);
    expect(inspected.kind).toBe("meet");
    if (inspected.kind !== "meet") return;
    expect(inspected.summary.entries).toBeGreaterThan(0);
    expect(inspected.sourceFiles.length).toBeGreaterThan(0);
  });

  it("merges companion files picked together", () => {
    const inspected = inspectFiles([
      fixture("azsi-events.ev3"),
      fixture("azsi-results.cl2"),
    ]);
    expect(inspected.kind).toBe("meet");
    if (inspected.kind !== "meet") return;
    expect(inspected.summary.events).toBeGreaterThan(0);
    expect(inspected.summary.results).toBeGreaterThan(0);
  });

  it("falls back to the roster parser for Team Manager roster exports", () => {
    const inspected = inspectFiles([fixture("roster-only.hy3")]);
    expect(inspected.kind).toBe("roster");
    if (inspected.kind !== "roster") return;
    expect(inspected.rows.length).toBeGreaterThan(0);
  });

  it("rejects unsupported and empty selections", () => {
    expect(() => inspectFiles([])).toThrow(/at least one/);
    expect(() =>
      inspectFiles([{ filename: "notes.txt", bytes: new Uint8Array() }]),
    ).toThrow(/Unsupported file: notes.txt/);
  });

  it("rethrows parse errors that aren't roster fallbacks", () => {
    expect(() =>
      inspectFiles([fixture("ctcc-entries.zip"), fixture("azsi-results.hy3")]),
    ).toThrow(/not both together/);
  });
});
