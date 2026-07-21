import { describe, expect, it } from "vitest";
import {
  formatSwimmerLastFirst,
  normalizePersonName,
  sortSwimmersByLastName,
} from "../src/people";

describe("normalizePersonName", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizePersonName("O'Brien, James")).toBe("o brien james");
    expect(normalizePersonName("  A   B  ")).toBe("a b");
  });
});

describe("formatSwimmerLastFirst", () => {
  it("uses preferred name when present", () => {
    expect(
      formatSwimmerLastFirst({
        firstName: "James",
        lastName: "Smith",
        preferredName: "Jim",
      }),
    ).toBe("Smith, Jim");
    expect(
      formatSwimmerLastFirst({
        firstName: "James",
        lastName: "Smith",
      }),
    ).toBe("Smith, James");
    expect(
      formatSwimmerLastFirst({
        firstName: "James",
        lastName: "Smith",
        preferredName: "   ",
      }),
    ).toBe("Smith, James");
  });
});

describe("sortSwimmersByLastName", () => {
  it("sorts by last name then first/preferred name without mutating input", () => {
    const swimmers = [
      { firstName: "Bob", lastName: "Zeta" },
      { firstName: "Amy", lastName: "Alpha" },
      { firstName: "Ann", lastName: "Alpha", preferredName: "Annie" },
      { firstName: "Carl", lastName: "Alpha", preferredName: "Charles" },
    ];
    const sorted = sortSwimmersByLastName(swimmers);
    expect(sorted.map((s) => s.firstName)).toEqual([
      "Amy",
      "Ann",
      "Carl",
      "Bob",
    ]);
    expect(swimmers.map((s) => s.firstName)).toEqual([
      "Bob",
      "Amy",
      "Ann",
      "Carl",
    ]);

    const preferredSort = sortSwimmersByLastName([
      { firstName: "Amy", lastName: "Alpha" },
      { firstName: "Bob", lastName: "Alpha", preferredName: "Bobby" },
      { firstName: "Carl", lastName: "Alpha", preferredName: "   " },
    ]);
    expect(preferredSort[0]?.firstName).toBe("Amy");
    expect(preferredSort[1]?.preferredName).toBe("Bobby");
    expect(preferredSort[2]?.firstName).toBe("Carl");
  });
});
