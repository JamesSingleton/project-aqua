import { describe, expect, it } from "vitest";
import { parseMeetResultsCsv } from "../src/meet-results-csv";

describe("parseMeetResultsCsv", () => {
  it("parses event, swimmer, and time columns", () => {
    const rows = parseMeetResultsCsv(`Event #,Swimmer,Time,Place
3,Alex Smith,32.15,1
`);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.eventNumber).toBe(3);
    expect(rows[0]?.swimmerName).toBe("Alex Smith");
    expect(rows[0]?.timeMs).toBe(32150);
    expect(rows[0]?.place).toBe(1);
  });

  it("throws when required columns are missing", () => {
    expect(() => parseMeetResultsCsv("Name,Time\nAlex,32.15\n")).toThrow(
      /Event #/,
    );
  });
});
