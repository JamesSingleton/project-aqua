/**
 * Parity notes vs Python hytek-parser (oracle only — not a runtime dependency).
 *
 * Field map (1-based, matching hytek_parser._utils.extract):
 * - D1 gender: 3,1
 * - D1 meet_id: 4,5
 * - D1 last/first/nick: 9,20 / 29,20 / 49,20
 * - D1 USA ID: 70,14
 * - D1 DOB: 89,8 (MMDDYYYY)  ← critical parity fix
 * - D1 age: 97,3
 * - D1 class_year: 100,2
 * - E1 exhibition: 84,1 === "X"
 * - E2 round: 3,1 P/S/F → prelim/swimoff/finals
 *
 * CL2 / EV3 / SDIF have no Python coverage — TS is the source of truth.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseHy3 } from "../../src/hy3/parser";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function padHy3(line: string, len = 130): string {
  return line.padEnd(len, " ");
}

describe("hytek-parser parity — HY3 D1 DOB (cols 89–96)", () => {
  it("reads MMDDYYYY DOB from D1 the same way as hytek_parser d1_parser", () => {
    // Construct a D1 line with DOB at 1-based col 89 = 1985-06-15 → 06151985
    const chars = Array.from({ length: 130 }, () => " ");
    const put = (oneBased: number, s: string) => {
      for (let i = 0; i < s.length; i++) chars[oneBased - 1 + i] = s[i]!;
    };
    put(1, "D1");
    put(3, "F");
    put(4, "   42");
    put(9, "Swimmer");
    put(29, "Test");
    put(70, "06151985TEST"); // USA-style id also embeds DOB
    put(89, "06151985");
    put(97, " 40");

    const content = [
      padHy3("A102Meet Results              Hy-Tek"),
      padHy3(
        "B1Parity Meet                                 Pool                                         0101202501012025",
      ),
      padHy3("C1TEAM Test Team                    TST"),
      chars.join(""),
      padHy3(
        "E1F   42SwimmF    50A  0 18  0U  0.00  1B   28.00Y   28.00Y    0.00    0.00  0NN               N",
      ),
      padHy3("E2F  28.00Y  1  1  1   1"),
    ].join("\n");

    const meet = parseHy3(content);
    expect(meet.entries[0]?.dateOfBirth).toBe("1985-06-15");
    expect(meet.results[0]?.dateOfBirth).toBe("1985-06-15");
  });

  it("falls back to USA member ID DOB when D1 DOB blank (still usable for Add athlete)", () => {
    const chars = Array.from({ length: 130 }, () => " ");
    const put = (oneBased: number, s: string) => {
      for (let i = 0; i < s.length; i++) chars[oneBased - 1 + i] = s[i]!;
    };
    put(1, "D1");
    put(3, "M");
    put(4, "    7");
    put(9, "Doe");
    put(29, "John");
    // USA member IDs embed MMDDYY (not YYYY) — 061585 → 1985-06-15
    put(70, "061585JOHNDOE1");
    put(97, " 40");

    const content = [
      padHy3("A102Meet Entries              Hy-Tek"),
      padHy3(
        "B1Parity Meet                                 Pool                                         0101202501012025",
      ),
      padHy3("C1TEAM Test Team                    TST"),
      chars.join(""),
      padHy3(
        "E1M    7Doe  M    50A  0 18  0U  0.00  1B   30.00Y   30.00Y    0.00    0.00  0NN               N",
      ),
    ].join("\n");

    const meet = parseHy3(content);
    expect(meet.entries[0]?.dateOfBirth).toBe("1985-06-15");
  });

  it("parses DOB from real AZSI results fixture when present on D1", () => {
    const content = readFileSync(join(fixturesDir, "azsi-results.hy3"), "utf8");
    const meet = parseHy3(content);
    const withDob = meet.results.filter((r) => r.dateOfBirth);
    // Real MM files usually carry DOB on D1; assert we surface at least some.
    expect(withDob.length).toBeGreaterThan(0);
    for (const r of withDob.slice(0, 5)) {
      expect(r.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("hytek-parser parity — multi-round E2 emission", () => {
  it("emits both prelim and finals when an entry has both E2 rounds", () => {
    const line = (fill: (put: (col: number, s: string) => void) => void) => {
      const chars = Array.from({ length: 130 }, () => " ");
      const put = (oneBased: number, s: string) => {
        for (let i = 0; i < s.length; i++) chars[oneBased - 1 + i] = s[i]!;
      };
      fill(put);
      return chars.join("");
    };

    const content = [
      line((put) => {
        put(1, "A1");
        put(3, "02Meet Results");
      }),
      line((put) => {
        put(1, "B1");
        put(3, "Round Meet");
        put(48, "Pool");
        put(93, "01012025");
        put(101, "01012025");
      }),
      line((put) => {
        put(1, "C1");
        put(3, "TEAM");
        put(8, "Test Team");
      }),
      line((put) => {
        put(1, "D1");
        put(3, "F");
        put(4, "   11");
        put(9, "Alpha");
        put(29, "Ann");
        put(89, "01012010");
        put(97, " 15");
      }),
      line((put) => {
        put(1, "E1");
        put(3, "F");
        put(4, "   11");
        put(14, "F");
        put(16, "   100");
        put(22, "A");
        put(23, "  0");
        put(26, " 18");
        put(39, "   5");
        put(51, "Y");
        put(52, "  65.00");
        put(60, "Y");
      }),
      line((put) => {
        put(1, "E2");
        put(3, "P");
        put(4, "  66.00");
        put(13, "Y");
        put(21, "  2");
        put(24, "  3");
        put(30, "   8");
      }),
      line((put) => {
        put(1, "E2");
        put(3, "F");
        put(4, "  64.50");
        put(13, "Y");
        put(21, "  1");
        put(24, "  4");
        put(30, "   2");
      }),
    ].join("\n");

    const meet = parseHy3(content);
    expect(meet.entries.length).toBe(1);
    expect(meet.results.length).toBe(2);
    const ann = meet.results.filter((r) => r.swimmerName.includes("Ann"));
    expect(ann.map((r) => r.resultType).sort()).toEqual(["finals", "prelim"]);
    expect(ann.find((r) => r.resultType === "finals")?.time).toBe("1:04.50");
    expect(ann.find((r) => r.resultType === "prelim")?.heat).toBe(2);
    expect(ann.find((r) => r.resultType === "finals")?.lane).toBe(4);
  });
});
