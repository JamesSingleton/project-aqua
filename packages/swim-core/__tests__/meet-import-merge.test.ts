import { describe, expect, it } from "vitest";
import {
  detectMeetEventImportConflicts,
  resolveImportedEventForMerge,
} from "../src/meet-import-merge";

describe("detectMeetEventImportConflicts", () => {
  it("flags same number with different keys", () => {
    const conflicts = detectMeetEventImportConflicts(
      [
        {
          eventNumber: 3,
          eventKey: "50_free_scy_f",
          stroke: "free",
          distance: 50,
          gender: "female",
        },
      ],
      [
        {
          eventNumber: 3,
          eventKey: "100_free_scy_f",
          stroke: "free",
          distance: 100,
          gender: "female",
        },
      ],
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.eventNumber).toBe(3);
  });

  it("ignores matching events", () => {
    const conflicts = detectMeetEventImportConflicts(
      [
        {
          eventNumber: 3,
          eventKey: "50_free_scy_f",
          stroke: "free",
          distance: 50,
          gender: "female",
        },
      ],
      [
        {
          eventNumber: 3,
          eventKey: "50_free_scy_f",
          stroke: "free",
          distance: 50,
          gender: "female",
        },
      ],
    );

    expect(conflicts).toHaveLength(0);
  });
});

describe("resolveImportedEventForMerge", () => {
  const existing = {
    eventNumber: 1,
    eventKey: "50_free_scy_f",
    stroke: "free",
    distance: 50,
    gender: "female",
  };
  const imported = {
    eventNumber: 1,
    eventKey: "100_free_scy_f",
    stroke: "free",
    distance: 100,
    gender: "female",
  };

  it("adds when no existing event", () => {
    expect(resolveImportedEventForMerge(undefined, imported, undefined)).toBe(
      "add",
    );
  });

  it("replaces imported rows when resolution is use_import", () => {
    expect(
      resolveImportedEventForMerge(
        { ...existing, importedFromFile: true },
        imported,
        "use_import",
      ),
    ).toBe("replace");
  });

  it("does not rewrite hand-added events even when use_import is chosen", () => {
    expect(
      resolveImportedEventForMerge(
        { ...existing, importedFromFile: false },
        imported,
        "use_import",
      ),
    ).toBe("skip");
  });

  it("refreshes matching imported events", () => {
    expect(
      resolveImportedEventForMerge(
        { ...existing, importedFromFile: true },
        existing,
        undefined,
      ),
    ).toBe("refresh");
  });

  it("skips conflicts by default", () => {
    expect(
      resolveImportedEventForMerge(
        { ...existing, importedFromFile: true },
        imported,
        undefined,
      ),
    ).toBe("skip");
  });

  it("auto-replaces course-only key drift on file-backed events", () => {
    expect(
      resolveImportedEventForMerge(
        {
          eventNumber: 9,
          eventKey: "100_fly_lcm_m",
          stroke: "fly",
          distance: 100,
          gender: "male",
          importedFromFile: true,
        },
        {
          eventNumber: 9,
          eventKey: "100_fly_scy_m",
          stroke: "fly",
          distance: 100,
          gender: "male",
        },
        undefined,
      ),
    ).toBe("replace");
  });

  it("does not treat course-only drift as a coach conflict", () => {
    expect(
      detectMeetEventImportConflicts(
        [
          {
            eventNumber: 9,
            eventKey: "100_fly_lcm_m",
            stroke: "fly",
            distance: 100,
            gender: "male",
          },
        ],
        [
          {
            eventNumber: 9,
            eventKey: "100_fly_scy_m",
            stroke: "fly",
            distance: 100,
            gender: "male",
          },
        ],
      ),
    ).toHaveLength(0);
  });
});
