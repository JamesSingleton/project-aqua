import { describe, expect, it } from "vitest";
import { getSortingStateParser } from "../../lib/parsers";

describe("getSortingStateParser", () => {
  const parser = getSortingStateParser(["name", "age"]);

  it("parses valid sorting JSON", () => {
    expect(parser.parse('[{"id":"name","desc":true}]')).toEqual([
      { id: "name", desc: true },
    ]);
  });

  it("rejects invalid JSON, shape, or unknown columns", () => {
    expect(parser.parse("not-json")).toBeNull();
    expect(parser.parse('{"id":"name"}')).toBeNull();
    expect(parser.parse('[{"id":"unknown","desc":false}]')).toBeNull();
  });

  it("allows any column when no allowlist", () => {
    const open = getSortingStateParser();
    expect(open.parse('[{"id":"anything","desc":false}]')).toEqual([
      { id: "anything", desc: false },
    ]);
  });

  it("accepts Set column ids and serializes/eq", () => {
    const withSet = getSortingStateParser(new Set(["name"]));
    const value = [{ id: "name" as const, desc: false }];
    expect(withSet.parse(JSON.stringify(value))).toEqual(value);
    expect(withSet.serialize(value)).toBe(JSON.stringify(value));
    expect(withSet.eq(value, value)).toBe(true);
    expect(withSet.eq(value, [{ id: "name", desc: true }])).toBe(false);
    expect(withSet.eq(value, [])).toBe(false);
  });
});
