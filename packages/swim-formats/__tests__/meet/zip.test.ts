import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { parseEv3 } from "../../src/ev3/parser";
import { extractMeetFileFromZip } from "../../src/meet/zip";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function zipOf(files: Record<string, string | Uint8Array>): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    entries[name] = typeof content === "string" ? strToU8(content) : content;
  }
  return zipSync(entries);
}

describe("extractMeetFileFromZip", () => {
  it("prefers EV3 over HYV when both are present", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"));
    const hyv = readFileSync(join(fixturesDir, "charger-events.hyv"));
    const bytes = zipOf({
      "meet.hyv": hyv,
      "meet.ev3": ev3,
    });
    const extracted = extractMeetFileFromZip(bytes);
    expect(extracted.format).toBe("ev3");
    expect(extracted.filename).toBe("meet.ev3");
  });

  it("falls back to HYV when EV3 is absent", () => {
    const hyv = readFileSync(join(fixturesDir, "charger-events.hyv"), "utf8");
    const bytes = zipOf({ "events.hyv": hyv });
    const extracted = extractMeetFileFromZip(bytes);
    expect(extracted.format).toBe("hyv");
  });

  it("finds EV3 under a nested folder path", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"), "utf8");
    const bytes = zipOf({
      "Meet Events-foo/foo.ev3": ev3,
      "__MACOSX/._foo.ev3": "junk",
      ".DS_Store": "junk",
    });
    const extracted = extractMeetFileFromZip(bytes);
    expect(extracted.format).toBe("ev3");
    expect(extracted.filename).toBe("foo.ev3");
  });

  it("rejects empty or junk-only archives", () => {
    const bytes = zipOf({
      "__MACOSX/._notes.txt": "x",
      ".DS_Store": "y",
      "readme.txt": "not a meet file",
    });
    expect(() => extractMeetFileFromZip(bytes)).toThrow(
      /doesn't contain a supported meet file/,
    );
  });

  it("parses preferred EV3 from a Meet Events zip with QTs intact", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"));
    const hyv = readFileSync(join(fixturesDir, "charger-events.hyv"));
    const bytes = zipOf({
      "pack.hyv": hyv,
      "pack.ev3": ev3,
    });
    const extracted = extractMeetFileFromZip(bytes);
    expect(extracted.format).toBe("ev3");
    const text = new TextDecoder("utf-8").decode(extracted.bytes);
    const meet = parseEv3(text);
    expect(meet.name).toMatch(/Charger/);
    const e13 = meet.events.find((e) => e.eventNumber === 13);
    expect(e13?.qualifyingTimeMs).toBe(6 * 60_000 + 30_000);
  });
});
