import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ParsedMeet } from "@lane4hq/swim-formats";
import { describe, expect, it } from "vitest";
import {
  diffMeets,
  hasDifferences,
  normalizeName,
  normalizeTime,
} from "../src/lib/meet-diff";
import { EXPORT_FORMATS, exportMeet } from "../src/lib/meet-export";
import { inspectFiles, type SourceFile } from "../src/lib/meet-file";

const fixtures = fileURLToPath(
  new URL("../../../packages/swim-formats/fixtures/", import.meta.url),
);

function fixture(filename: string): SourceFile {
  return {
    filename,
    bytes: new Uint8Array(readFileSync(`${fixtures}${filename}`)),
  };
}

function loadMeet(...filenames: string[]): ParsedMeet {
  const inspected = inspectFiles(filenames.map(fixture));
  if (inspected.kind !== "meet") throw new Error("expected a meet");
  return inspected.meet;
}

describe("normalizers", () => {
  it("treats Last, First and First Last as the same swimmer", () => {
    expect(normalizeName("Doe, Jane")).toBe(normalizeName("jane DOE"));
    expect(normalizeName("O'Neil, Sam  R")).toBe(normalizeName("Sam R ONeil"));
  });

  it("canonicalizes times and treats blanks as NT", () => {
    expect(normalizeTime("1:05.30")).toBe(normalizeTime("65.30"));
    expect(normalizeTime("28.40Y")).toBe(normalizeTime("28.40"));
    expect(normalizeTime(undefined)).toBe("NT");
    expect(normalizeTime("")).toBe("NT");
  });
});

describe("diffMeets", () => {
  it("reports no differences for identical meets", () => {
    const meet = loadMeet("ctcc-entries.hy3");
    expect(hasDifferences(diffMeets(meet, meet))).toBe(false);
  });

  it("finds missing, extra, and changed entries", () => {
    const original = loadMeet("ctcc-entries.hy3");
    const [first, second, ...rest] = original.entries;
    if (!first || !second) throw new Error("fixture needs entries");
    const candidate: ParsedMeet = {
      ...original,
      entries: [
        { ...first, seedTime: "9:59.99" },
        ...rest,
        { ...first, swimmerName: "Nobody, New" },
      ],
    };

    const { entries } = diffMeets(original, candidate);
    const kinds = entries.rows.map((row) => row.status).sort();
    expect(kinds).toEqual(["changed", "extra", "missing"]);
    const changed = entries.rows.find((row) => row.status === "changed");
    expect(changed?.status === "changed" && changed.changes[0]?.field).toBe(
      "seed",
    );
    expect(entries.original).toBe(original.entries.length);
    expect(entries.candidate).toBe(candidate.entries.length);
  });

  it("detects a DQ flip on a result", () => {
    const original = loadMeet("azsi-results.hy3");
    const [first, ...rest] = original.results;
    if (!first) throw new Error("fixture needs results");
    const candidate: ParsedMeet = {
      ...original,
      results: [{ ...first, isDq: !first.isDq }, ...rest],
    };
    const { results } = diffMeets(original, candidate);
    expect(results.rows).toHaveLength(1);
    expect(results.rows[0]?.status).toBe("changed");
  });
});

describe("exportMeet", () => {
  const meet = loadMeet("ctcc-entries.hy3");

  for (const format of EXPORT_FORMATS) {
    it(`writes a re-openable ${format} file`, () => {
      const exported = exportMeet(meet, format);
      expect(exported.filename.toLowerCase().endsWith(`.${format}`)).toBe(true);
      expect(exported.bytes.length).toBeGreaterThan(0);
      expect(inspectFiles([exported]).kind).toBe("meet");
    });
  }
});

describe("HY3 export round-trip", () => {
  const packs: Array<[string, string[]]> = [
    ["entries HY3", ["ctcc-entries.hy3"]],
    ["entries ZIP", ["ctcc-entries.zip"]],
    ["mari entries HY3", ["mari-entries.hy3"]],
    ["results HY3", ["azsi-results.hy3"]],
  ];

  for (const [label, files] of packs) {
    it(`${label} keeps events and entries`, () => {
      const original = loadMeet(...files);
      const reparsed = inspectFiles([exportMeet(original, "hy3")]);
      if (reparsed.kind !== "meet") throw new Error("expected a meet");
      const diff = diffMeets(original, reparsed.meet);
      expect(diff.events.rows).toEqual([]);
      expect(diff.entries.rows).toEqual([]);
    });
  }
});
