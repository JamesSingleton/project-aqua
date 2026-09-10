import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { parseEv3, parseHyv } from "../../src/ev3/parser";
import {
  extractAllMeetFilesFromZip,
  parseMeetFileFromBytes,
} from "../../src/meet/parser";
import { parseRosterFileFromBytes } from "../../src/roster/parser";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("golden corpus — meet results", () => {
  it("imports CTCC CL2-only results zip", () => {
    const bytes = new Uint8Array(
      readFileSync(join(fixturesDir, "ctcc-meet-results-2005.zip")),
    );
    const meet = parseMeetFileFromBytes(bytes, "ctcc-meet-results-2005.zip");
    expect(meet.results.length).toBe(9);
    expect(meet.name).toMatch(/CTCCvPDC/);
  });
});

describe("golden corpus — entries packs", () => {
  it("merges CL2+HY3 entries zip without treating F0 as results", () => {
    const bytes = new Uint8Array(
      readFileSync(join(fixturesDir, "ctcc-entries.zip")),
    );
    const bundle = extractAllMeetFilesFromZip(bytes);
    expect(bundle.files.map((f) => f.format).sort()).toEqual(["cl2", "hy3"]);
    const meet = parseMeetFileFromBytes(bytes, "ctcc-entries.zip");
    expect(meet.entries.length).toBeGreaterThan(0);
    expect(meet.results.length).toBe(0);
    expect(meet.sourceFiles?.length).toBeGreaterThan(1);
  });

  it("splits Team Manager F0 team+letter glue in a HY3+CL2 entries zip", () => {
    const hy3 = readFileSync(join(fixturesDir, "mari-entries.hy3"), "utf8");
    const cl2 = readFileSync(join(fixturesDir, "mari-entries.cl2"), "utf8");
    const bytes = zipSync({
      "mari-entries.hy3": strToU8(hy3),
      "mari-entries.cl2": strToU8(cl2),
    });
    const meet = parseMeetFileFromBytes(bytes, "mari-entries.zip");
    const names = [
      ...meet.entries.map((e) => e.swimmerName),
      ...(meet.relays ?? []).flatMap((r) => r.swimmerNames),
      ...(meet.athletes ?? []).map((a) => a.name),
    ];
    expect(names.some((name) => /MARIA/i.test(name))).toBe(false);
    expect(names).toContain("Marlie McNamee");
  });
});

describe("golden corpus — roster packs", () => {
  it("rejects roster-only zip on meet import path", () => {
    const bytes = new Uint8Array(
      readFileSync(join(fixturesDir, "ctcc-roster.zip")),
    );
    expect(() => parseMeetFileFromBytes(bytes, "ctcc-roster.zip")).toThrow(
      /Roster/i,
    );
  });

  it("parses roster zip on roster path (nested entries ignored for rows)", () => {
    const bytes = new Uint8Array(
      readFileSync(join(fixturesDir, "ctcc-roster.zip")),
    );
    const rows = parseRosterFileFromBytes(bytes, "ctcc-roster.zip");
    expect(rows.length).toBeGreaterThan(50);
  });
});

describe("golden corpus — meet events EV3/HYV", () => {
  it("parses Charger events zip preferring EV3 and including dive events", () => {
    const bytes = new Uint8Array(
      readFileSync(join(fixturesDir, "charger-events.zip")),
    );
    const meet = parseMeetFileFromBytes(bytes, "charger-events.zip");
    expect(meet.name).toMatch(/Charger/);
    expect(meet.events.length).toBeGreaterThan(10);
    expect(meet.skippedDiveEvents).toBe(undefined);
    expect(meet.events.some((e) => e.eventKind === "dive")).toBe(true);
  });

  it("parses Croswhite 2025/2026 and Desert Sunrise event zips", () => {
    for (const name of [
      "croswhite-2025-events.zip",
      "croswhite-2026-events.zip",
      "desert-sunrise-events.zip",
    ]) {
      const bytes = new Uint8Array(readFileSync(join(fixturesDir, name)));
      const meet = parseMeetFileFromBytes(bytes, name);
      expect(meet.events.length).toBeGreaterThan(10);
      expect(meet.name.length).toBeGreaterThan(0);
    }
  });

  it("parses bare Sonoran EV3", () => {
    const content = readFileSync(
      join(fixturesDir, "sonoran-events.ev3"),
      "utf8",
    );
    const meet = parseEv3(content);
    expect(meet.events.length).toBe(22);
  });

  it("parses Croswhite HYV dive stroke as a dive event by default", () => {
    const content = readFileSync(
      join(fixturesDir, "croswhite-2025-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content);
    expect(meet.skippedDiveEvents).toBe(undefined);
    expect(meet.events.some((e) => e.eventKind === "dive")).toBe(true);
  });

  it("still skips Croswhite HYV dive events when includeDiveEvents is false", () => {
    const content = readFileSync(
      join(fixturesDir, "croswhite-2025-events.hyv"),
      "utf8",
    );
    const meet = parseHyv(content, { includeDiveEvents: false });
    expect(meet.skippedDiveEvents).toBeGreaterThan(0);
  });
});
