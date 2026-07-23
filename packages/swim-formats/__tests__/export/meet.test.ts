import { describe, expect, it } from "vitest";
import { exportHy3, exportSdif } from "../../src/export/meet";
import type { ParsedMeet } from "../../src/types";

const baseMeet: ParsedMeet = {
  name: "Test Meet",
  course: "SCY",
  location: "Test Pool",
  events: [
    {
      eventNumber: 1,
      distance: 50,
      stroke: "free",
      gender: "female",
      eventKey: "50_free_scy_f",
    },
    {
      eventNumber: 2,
      distance: 100,
      stroke: "back",
      gender: "male",
      eventKey: "100_back_scy_m",
    },
    {
      eventNumber: 3,
      distance: 200,
      stroke: "breast",
      gender: "mixed",
      eventKey: "200_breast_scy_x",
    },
    {
      eventNumber: 4,
      distance: 50,
      stroke: "fly",
      gender: "female",
      eventKey: "50_fly_scy_f",
    },
    {
      eventNumber: 5,
      distance: 200,
      stroke: "im",
      gender: "male",
      eventKey: "200_im_scy_m",
    },
    {
      eventNumber: 6,
      distance: 50,
      stroke: "unknown_stroke",
      gender: "female",
      eventKey: "50_unknown_scy_f",
    },
  ],
  entries: [
    {
      eventNumber: 1,
      swimmerName: "Ada Lovelace",
      seedTime: "28.50",
      usaMemberId: "USA123",
    },
    { eventNumber: 2, swimmerName: "Bob", seedTime: "1:05.00" },
  ],
  results: [
    {
      eventNumber: 1,
      swimmerName: "Ada Lovelace",
      time: "27.50",
      place: 1,
      isDq: false,
    },
    {
      eventNumber: 2,
      swimmerName: "Bob",
      time: "1:04.00",
      place: 2,
      isDq: true,
    },
  ],
  relays: [
    {
      eventNumber: 10,
      swimmerNames: ["A One", "B Two", "C Three", "D Four"],
      seedTime: "1:40.00",
    },
  ],
};

describe("exportSdif", () => {
  it("exports events, entries, results, and terminator", () => {
    const text = exportSdif(baseMeet);
    expect(text).toContain("A01V3");
    expect(text).toContain("Test Meet");
    expect(text).toContain("Test Pool");
    expect(text).toContain("E1");
    expect(text).toContain("D0");
    expect(text).toContain("G0");
    expect(text.endsWith("Z0")).toBe(true);
  });

  it("uses course digit for SCM and LCM", () => {
    expect(exportSdif({ ...baseMeet, course: "SCM" })).toMatch(/B11.{68}2/);
    expect(exportSdif({ ...baseMeet, course: "LCM" })).toMatch(/B11.{68}3/);
  });

  it("handles single-word swimmer names in entries/results", () => {
    const text = exportSdif({
      ...baseMeet,
      entries: [{ eventNumber: 1, swimmerName: "Madonna" }],
      results: [{ eventNumber: 1, swimmerName: "Madonna", time: "30.00" }],
    });
    expect(text).toContain("Madonna");
  });
});

describe("exportHy3", () => {
  it("exports HY3 events, entries, and relay legs", () => {
    const text = exportHy3(baseMeet);
    expect(text).toContain("A102Meet Entries");
    expect(text).toContain("Test Meet");
    expect(text).toContain("E1");
    expect(text).toContain("D0");
    expect(text).toContain("F0");
    expect(text.split("G0").length).toBeGreaterThan(2);
  });

  it("maps all stroke variants and alternate courses", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      course: "SCM",
      events: [
        { eventNumber: 1, distance: 50, stroke: "free", gender: "female", eventKey: "x" },
        { eventNumber: 2, distance: 50, stroke: "back", gender: "male", eventKey: "x" },
        { eventNumber: 3, distance: 50, stroke: "breast", gender: "male", eventKey: "x" },
        { eventNumber: 4, distance: 50, stroke: "fly", gender: "male", eventKey: "x" },
        { eventNumber: 5, distance: 200, stroke: "im", gender: "male", eventKey: "x" },
      ],
    };
    const text = exportHy3(meet);
    expect(text).toContain("FR ");
    expect(text).toContain("BK ");
    expect(text).toContain("BR ");
    expect(text).toContain("FL ");
    expect(text).toContain("IM ");
  });

  it("exports SCM course and all HY3 stroke branches", () => {
    const meet: ParsedMeet = {
      name: "Export",
      course: "SCM",
      events: [
        { eventNumber: 1, distance: 50, stroke: "free", gender: "female", eventKey: "x" },
        { eventNumber: 2, distance: 50, stroke: "back", gender: "male", eventKey: "x" },
        { eventNumber: 3, distance: 50, stroke: "breast", gender: "male", eventKey: "x" },
        { eventNumber: 4, distance: 50, stroke: "fly", gender: "male", eventKey: "x" },
        { eventNumber: 5, distance: 200, stroke: "im", gender: "male", eventKey: "x" },
        { eventNumber: 6, distance: 50, stroke: "unknown", gender: "mixed", eventKey: "x" },
      ],
      entries: [{ eventNumber: 1, swimmerName: "Ada Lovelace" }],
      results: [],
    };
    const text = exportHy3(meet);
    expect(text).toContain("BK ");
    expect(text).toContain("BR ");
    expect(text).toContain("FL ");
    expect(text).toContain("IM ");
  });

  it("covers undefined event numbers, LCM course, and seedless relays", () => {
    const meet: ParsedMeet = {
      name: "Sparse",
      course: "LCM",
      events: [
        { distance: 50, stroke: "free", gender: "female", eventKey: "x" },
      ],
      entries: [{ swimmerName: "Solo Name" }],
      results: [{ swimmerName: "Solo Name", time: "30.00" }],
      relays: [
        {
          swimmerNames: ["A", "B", "C", "D"],
        },
      ],
    };
    const sdif = exportSdif(meet);
    expect(sdif).toMatch(/B11.{68}3/);
    expect(sdif).toContain("0000");

    const hy3 = exportHy3(meet);
    expect(hy3).toMatch(/^B13/m);
    expect(hy3).toContain("F0");
    expect(hy3).toContain("G0");
  });
});
