import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { exportSdif, parseSdif, parseTime } from "../../src/sdif/parser";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function sdifB1Line(
  name: string,
  location: string,
  startDate: string,
  courseSuffix = " LCM",
): string {
  let line = "B11";
  line = line.padEnd(11, " ");
  line += name.padEnd(30, " ").slice(0, 30);
  line += location.padEnd(30, " ").slice(0, 30);
  line += startDate.padEnd(8, " ").slice(0, 8);
  return line + courseSuffix;
}

describe("parseSdif", () => {
  it("parses TeamUnify SD3 fixture", () => {
    const content = readFileSync(
      join(fixturesDir, "AZAZSL_ext7716201449890453768.sd3"),
    ).toString("utf8");
    const meet = parseSdif(content);

    expect(meet.name.length).toBeGreaterThan(0);
    expect(meet.entries.length).toBeGreaterThan(0);
  });

  it("parses synthetic SDIF records for all branches", () => {
    const content = [
      "A0V3      02Meet Entries                  Custom Title From A0",
      sdifB1Line("B1 Meet Name", "B1 Location", "01012025"),
      ...exportSdif({
        name: "unused",
        course: "SCY",
        events: [
          { eventNumber: 1, distance: 50, stroke: "free", gender: "female", eventKey: "x" },
          { eventNumber: 2, distance: 100, stroke: "back", gender: "male", eventKey: "x" },
        ],
        entries: [
          { eventNumber: 1, swimmerName: "Ada Lovelace", seedTime: "1:05.00", usaMemberId: "MEMBER123456" },
          { eventNumber: 2, swimmerName: "Bob Smith", seedTime: "1:06.00" },
        ],
        results: [
          { eventNumber: 1, swimmerName: "Ada Lovelace", time: "DQ", place: 1, isDq: true },
          { eventNumber: 2, swimmerName: "Bob Smith", time: "1:03.00", place: 2, isDq: false },
        ],
      })
        .split("\r\n")
        .filter(
          (line) =>
            line.startsWith("E1") ||
            line.startsWith("D0") ||
            line.startsWith("G0"),
        ),
    ].join("\n");

    const meet = parseSdif(content);
    expect(meet.name).toBe("B1 Meet Name");
    expect(meet.location).toBe("B1 Location");
    expect(meet.startDate).toBe("2025-01-01");
    expect(meet.course).toBe("LCM");

    expect(meet.events[0]).toMatchObject({
      eventNumber: 1,
      distance: 50,
      stroke: "free",
      gender: "female",
    });
    expect(meet.events[1]?.stroke).toBe("back");

    expect(meet.entries.length).toBe(2);
    expect(meet.results.length).toBe(2);
    expect(meet.results.some((r) => r.isDq)).toBe(true);
    expect(meet.results.every((r) => r.time.length > 0)).toBe(true);
  });

  it("detects SCM course from B1 line", () => {
    const meet = parseSdif("B1        SCM Meet                        Pool                          SCM");
    expect(meet.course).toBe("SCM");
  });

  it("skips G0 results without a time", () => {
    const meet = parseSdif(
      "G0    0003              Empty               Time                                    ",
    );
    expect(meet.results).toEqual([]);
  });

  it("uses fallback SDIF name, member id, and place fields", () => {
    const d0 =
      "D0         0002Smith               Bob                 " +
      " ".repeat(37) +
      "1:06.00";
    const g0 =
      "G0         0002Smith               Pat                 " +
      " ".repeat(21) +
      "1:03.00" +
      "002";
    const meet = parseSdif([d0, g0].join("\n"));
    expect(meet.entries[0]?.swimmerName).toBe("Bob Smith");
    expect(meet.entries[0]?.usaMemberId).toBeUndefined();
    expect(meet.results[0]?.swimmerName).toBe("Pat Smith");
    expect(meet.results[0]?.place).toBe(2);
  });
});

describe("sdif re-exports", () => {
  it("re-exports exportSdif and parseTime", () => {
    expect(typeof exportSdif).toBe("function");
    expect(parseTime("1:05.00")).toBeGreaterThan(0);
  });
});
