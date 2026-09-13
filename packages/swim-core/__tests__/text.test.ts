import { describe, expect, it } from "vitest";
import {
  normalizeOptionalText,
  normalizeOptionalTextUndefined,
} from "../src/text";

describe("normalizeOptionalText", () => {
  it("returns null for nullish or blank input", () => {
    expect(normalizeOptionalText(null, 10)).toBeNull();
    expect(normalizeOptionalText(undefined, 10)).toBeNull();
    expect(normalizeOptionalText("   ", 10)).toBeNull();
  });

  it("trims and returns text within max length", () => {
    expect(normalizeOptionalText("  hello  ", 10)).toBe("hello");
  });

  it("throws when over max length", () => {
    expect(() => normalizeOptionalText("too long", 3)).toThrow(
      "Must be 3 characters or fewer",
    );
  });
});

describe("normalizeOptionalTextUndefined", () => {
  it("returns undefined instead of null", () => {
    expect(normalizeOptionalTextUndefined(null, 10)).toBeUndefined();
    expect(normalizeOptionalTextUndefined("ok", 10)).toBe("ok");
  });
});
