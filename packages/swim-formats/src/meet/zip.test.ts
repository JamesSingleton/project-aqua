import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "fflate";
import { parseEv3 } from "../ev3/parser.ts";
import { extractMeetFileFromZip } from "./zip.ts";

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
    assert.equal(extracted.format, "ev3");
    assert.equal(extracted.filename, "meet.ev3");
  });

  it("falls back to HYV when EV3 is absent", () => {
    const hyv = readFileSync(join(fixturesDir, "charger-events.hyv"), "utf8");
    const bytes = zipOf({ "events.hyv": hyv });
    const extracted = extractMeetFileFromZip(bytes);
    assert.equal(extracted.format, "hyv");
  });

  it("finds EV3 under a nested folder path", () => {
    const ev3 = readFileSync(join(fixturesDir, "charger-events.ev3"), "utf8");
    const bytes = zipOf({
      "Meet Events-foo/foo.ev3": ev3,
      "__MACOSX/._foo.ev3": "junk",
      ".DS_Store": "junk",
    });
    const extracted = extractMeetFileFromZip(bytes);
    assert.equal(extracted.format, "ev3");
    assert.equal(extracted.filename, "foo.ev3");
  });

  it("rejects empty or junk-only archives", () => {
    const bytes = zipOf({
      "__MACOSX/._notes.txt": "x",
      ".DS_Store": "y",
      "readme.txt": "not a meet file",
    });
    assert.throws(
      () => extractMeetFileFromZip(bytes),
      /No supported meet file/,
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
    assert.equal(extracted.format, "ev3");
    const text = new TextDecoder("utf-8").decode(extracted.bytes);
    const meet = parseEv3(text);
    assert.match(meet.name, /Charger/);
    const e13 = meet.events.find((e) => e.eventNumber === 13);
    assert.equal(e13?.qualifyingTimeMs, 6 * 60_000 + 30_000);
  });
});
