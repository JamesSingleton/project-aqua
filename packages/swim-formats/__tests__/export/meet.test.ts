import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectCl2FileKind } from "../../src/cl2/kind";
import { parseCl2Meet } from "../../src/cl2/parser";
import { parseEv3, parseHyv } from "../../src/ev3/parser";
import {
  exportCl2,
  exportEv3,
  exportHy3,
  exportHyv,
  exportMeetZip,
  exportSdif,
} from "../../src/export/meet";
import { parseHy3 } from "../../src/hy3/parser";
import { extractAllMeetFilesFromZip } from "../../src/meet/zip";
import { parseSdif } from "../../src/sdif/parser";
import type { ParsedMeet } from "../../src/types";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

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
    { eventNumber: 2, swimmerName: "Bob Baker", seedTime: "1:05.00" },
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
      swimmerName: "Bob Baker",
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
  it("writes G0 rows even when a result omits a time value", () => {
    const text = exportSdif({
      ...baseMeet,
      results: [
        {
          eventNumber: 1,
          swimmerName: "Ada Lovelace",
          place: 4,
          isDq: true,
        },
      ],
    });
    expect(text).toContain("G0");
    expect(text).toContain("0004");
  });

  it("writes G0 heat, lane, place, and DQ flags on SDIF export", () => {
    const text = exportSdif({
      ...baseMeet,
      results: [
        {
          eventNumber: 1,
          swimmerName: "Ada Lovelace",
          time: "27.50",
          place: 3,
          heat: 2,
          lane: 4,
          isDq: true,
        },
      ],
    });
    expect(text).toContain("0003");
    expect(text).toMatch(/G0[\s\S]*D/);
  });

  it("writes G0 results without place when place is omitted", () => {
    const text = exportSdif({
      ...baseMeet,
      results: [
        {
          eventNumber: 1,
          swimmerName: "Ada Lovelace",
          time: "27.50",
          heat: 1,
          lane: 2,
        },
      ],
    });
    expect(text).toContain("G0");
    expect(text).toContain("27.50");
  });

  it("exports events, entries, results, and terminator", () => {
    const text = exportSdif(baseMeet);
    expect(text).toContain("A01V3");
    expect(text).toContain("Test Meet");
    expect(text).toContain("Test Pool");
    expect(text).toContain("E1");
    expect(text).toContain("D0");
    expect(text).toContain("G0");
    expect(text.endsWith("Z0")).toBe(true);
    expect(text).toMatch(/G0.{90,}0001/);
  });

  it("uses course digit for SCM and LCM", () => {
    const scm = exportSdif({ ...baseMeet, course: "SCM" });
    const lcm = exportSdif({ ...baseMeet, course: "LCM" });
    expect(parseSdif(scm).course).toBe("SCM");
    expect(parseSdif(lcm).course).toBe("LCM");
  });

  it("round-trips meet name, events, entries, results, and round metadata through parseSdif", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      startDate: "2025-06-01",
      endDate: "2025-06-02",
      results: [
        {
          eventNumber: 1,
          swimmerName: "Ada Lovelace",
          time: "27.50",
          place: 1,
          resultType: "prelim",
          heat: 2,
          lane: 5,
        },
        {
          eventNumber: 1,
          swimmerName: "Ada Lovelace",
          time: "27.10",
          place: 1,
          resultType: "finals",
          heat: 1,
          lane: 4,
        },
        {
          eventNumber: 2,
          swimmerName: "Bob Baker",
          time: "DQ",
          place: 9,
          isDq: true,
        },
        {
          eventNumber: 3,
          swimmerName: "Swim Off",
          time: "29.00",
          resultType: "swimoff",
        },
      ],
    };
    const parsed = parseSdif(exportSdif(meet));
    expect(parsed.name).toBe("Test Meet");
    expect(parsed.location).toBe("Test Pool");
    expect(parsed.events).toHaveLength(6);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.results).toHaveLength(4);

    const adaPrelim = parsed.results.find(
      (r) =>
        r.swimmerName.includes("Lovelace") &&
        r.swimmerName.includes("Ada") &&
        r.resultType === "prelim",
    );
    const adaFinals = parsed.results.find(
      (r) =>
        r.swimmerName.includes("Lovelace") &&
        r.swimmerName.includes("Ada") &&
        r.resultType === "finals",
    );
    expect(adaPrelim).toMatchObject({
      time: "27.50",
      place: 1,
      heat: 2,
      lane: 5,
    });
    expect(adaFinals).toMatchObject({
      time: "27.10",
      place: 1,
      heat: 1,
      lane: 4,
    });
    expect(parsed.results.find((r) => r.isDq)?.swimmerName).toContain("Baker");
    expect(
      parsed.results.find((r) => r.resultType === "swimoff")?.time,
    ).toBe("29.00");
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
  it("round-trips meet header, entries, results (incl. DQ), and relay legs through parseHy3", () => {
    const text = exportHy3(baseMeet);
    expect(text).toContain("A1");
    expect(text).toContain("D1");
    expect(text).toContain("E1");
    expect(text).toContain("E2");
    expect(text).toContain("F1");
    expect(text).toContain("F3");

    const parsed = parseHy3(text);
    expect(parsed.name).toBe("Test Meet");
    expect(parsed.location).toBe("Test Pool");
    expect(parsed.course).toBe("SCY");

    const adaEntry = parsed.entries.find(
      (e) => e.swimmerName === "Ada Lovelace",
    );
    expect(adaEntry).toMatchObject({
      eventNumber: 1,
      usaMemberId: "USA123",
      seedTime: "28.50",
    });

    const adaResult = parsed.results.find(
      (r) => r.swimmerName === "Ada Lovelace",
    );
    expect(adaResult).toMatchObject({
      eventNumber: 1,
      time: "27.50",
      place: 1,
      isDq: false,
    });

    const bobResult = parsed.results.find((r) => r.swimmerName === "Bob Baker");
    expect(bobResult?.isDq).toBe(true);

    expect(parsed.relays?.[0]).toMatchObject({ eventNumber: 10 });
    expect(parsed.relays?.[0]?.swimmerNames).toEqual([
      "A One",
      "B Two",
      "C Three",
      "D Four",
    ]);
  });

  it("round-trips all individual strokes and relay strokes for SCM/LCM courses", () => {
    for (const course of ["SCY", "SCM", "LCM"] as const) {
      const meet: ParsedMeet = {
        name: "Stroke Meet",
        course,
        events: [
          {
            eventNumber: 1,
            distance: 50,
            stroke: "free",
            gender: "female",
            eventKey: "x",
          },
          {
            eventNumber: 2,
            distance: 50,
            stroke: "back",
            gender: "male",
            eventKey: "x",
          },
          {
            eventNumber: 3,
            distance: 50,
            stroke: "breast",
            gender: "male",
            eventKey: "x",
          },
          {
            eventNumber: 4,
            distance: 50,
            stroke: "fly",
            gender: "male",
            eventKey: "x",
          },
          {
            eventNumber: 5,
            distance: 200,
            stroke: "im",
            gender: "male",
            eventKey: "x",
          },
          {
            eventNumber: 6,
            distance: 200,
            stroke: "free_relay",
            gender: "mixed",
            eventKey: "x",
          },
          {
            eventNumber: 7,
            distance: 200,
            stroke: "medley_relay",
            gender: "mixed",
            eventKey: "x",
          },
        ],
        entries: [
          { eventNumber: 1, swimmerName: "Ann Free" },
          { eventNumber: 2, swimmerName: "Bea Back" },
          { eventNumber: 3, swimmerName: "Cate Breast" },
          { eventNumber: 4, swimmerName: "Dee Fly" },
          { eventNumber: 5, swimmerName: "Eve Im" },
        ],
        results: [],
        relays: [
          {
            eventNumber: 6,
            swimmerNames: ["A One", "B Two", "C Three", "D Four"],
          },
          {
            eventNumber: 7,
            swimmerNames: ["E Five", "F Six", "G Seven", "H Eight"],
          },
        ],
      };
      const parsed = parseHy3(exportHy3(meet));
      expect(parsed.course).toBe(course);

      const byName = (name: string) =>
        parsed.entries.find((e) => e.swimmerName === name);
      expect(byName("Ann Free")?.eventNumber).toBe(1);
      expect(byName("Bea Back")?.eventNumber).toBe(2);
      expect(byName("Cate Breast")?.eventNumber).toBe(3);
      expect(byName("Dee Fly")?.eventNumber).toBe(4);
      expect(byName("Eve Im")?.eventNumber).toBe(5);

      const freeRelay = parsed.relays?.find((r) => r.eventNumber === 6);
      const medleyRelay = parsed.relays?.find((r) => r.eventNumber === 7);
      expect(freeRelay?.swimmerNames).toEqual([
        "A One",
        "B Two",
        "C Three",
        "D Four",
      ]);
      expect(medleyRelay?.swimmerNames).toEqual([
        "E Five",
        "F Six",
        "G Seven",
        "H Eight",
      ]);
    }
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
    expect(parseSdif(sdif).course).toBe("LCM");
    expect(sdif).toContain("0000");

    const hy3 = exportHy3(meet);
    expect(hy3).toContain("B1");
    expect(hy3).toContain("F1");
    expect(hy3).toContain("F3");

    const parsed = parseHy3(hy3);
    expect(parsed.course).toBe("LCM");
    // Single-letter names round-trip as "A A" etc: splitName has no last
    // name to split off, so the same token fills both first and last.
    expect(parsed.relays?.[0]?.swimmerNames).toEqual([
      "A A",
      "B B",
      "C C",
      "D D",
    ]);
  });

  it("derives the A1 title from importKind for results/roster/entries", () => {
    const base = { ...baseMeet, entries: [], results: [] };
    expect(
      parseHy3(exportHy3({ ...base, importKind: "results" })).importKind,
    ).toBe("results");
    expect(exportHy3({ ...base, importKind: "roster" })).toContain(
      "Rosters Only",
    );
    expect(exportHy3({ ...base, importKind: "entries" })).toContain(
      "Meet Entries",
    );
  });

  it("falls back to a results-from-MM title when importKind is unset but only results exist", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      importKind: undefined,
      entries: [],
      results: [{ eventNumber: 1, swimmerName: "Only Results", time: "29.00" }],
    };
    const text = exportHy3(meet);
    expect(text).toContain("Results From MM to TM");
  });

  it("round-trips altitude, notes, sanction number, and a female swimmer's D1 gender", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      altitude: 2500,
      notes: "High-altitude course",
      sanctionNumber: "AZ26-01",
      entries: [
        { eventNumber: 1, swimmerName: "Ada Lovelace", gender: "female" },
      ],
      results: [],
      relays: [],
    };
    const text = exportHy3(meet);
    const parsed = parseHy3(text);
    expect(parsed.sanctionNumber).toBe("AZ26-01");
    expect(parsed.notes).toContain("High-altitude course");
  });

  it("round-trips one-sided and ranged age groups on entries and relays", () => {
    const meet: ParsedMeet = {
      name: "Age Groups",
      course: "SCY",
      events: [
        {
          eventNumber: 1,
          distance: 50,
          stroke: "free",
          gender: "female",
          eventKey: "x",
          ageGroup: "15&O",
        },
        {
          eventNumber: 2,
          distance: 50,
          stroke: "back",
          gender: "male",
          eventKey: "x",
          ageGroup: "10&U",
        },
        {
          eventNumber: 3,
          distance: 200,
          stroke: "breast",
          gender: "mixed",
          eventKey: "x",
          ageGroup: "13-14",
        },
        {
          eventNumber: 4,
          distance: 50,
          stroke: "fly",
          gender: "male",
          eventKey: "x",
          ageGroup: "Masters",
        },
        {
          eventNumber: 6,
          distance: 200,
          stroke: "free_relay",
          gender: "mixed",
          eventKey: "x",
          ageGroup: "18&O",
        },
      ],
      entries: [
        { eventNumber: 1, swimmerName: "Senior Swimmer" },
        { eventNumber: 2, swimmerName: "Junior Swimmer" },
        { eventNumber: 3, swimmerName: "Mid Swimmer" },
        { eventNumber: 4, swimmerName: "Masters Swimmer" },
      ],
      results: [],
      relays: [
        {
          eventNumber: 6,
          swimmerNames: ["Rel One", "Rel Two", "Rel Three", "Rel Four"],
        },
      ],
    };
    const parsed = parseHy3(exportHy3(meet));
    expect(parsed.events.find((e) => e.eventNumber === 1)?.ageGroup).toBe(
      "15&O",
    );
    expect(parsed.events.find((e) => e.eventNumber === 2)?.ageGroup).toBe(
      "10&U",
    );
    expect(parsed.events.find((e) => e.eventNumber === 3)?.ageGroup).toBe(
      "13-14",
    );
    expect(parsed.events.find((e) => e.eventNumber === 6)?.ageGroup).toBe(
      "18&O",
    );
  });

  it("emits an E1 for a swimmer entered in two events (shared D1 registration)", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [
        { eventNumber: 1, swimmerName: "Ada Lovelace", usaMemberId: "USA123" },
        { eventNumber: 4, swimmerName: "Ada Lovelace" },
      ],
      results: [],
      relays: [],
    };
    const parsed = parseHy3(exportHy3(meet));
    const adaEntries = parsed.entries.filter(
      (e) => e.swimmerName === "Ada Lovelace",
    );
    expect(adaEntries.map((e) => e.eventNumber).sort()).toEqual([1, 4]);
  });

  it("emits an E1/E2 pair for a results-only swimmer with no matching entry", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [],
      results: [
        {
          eventNumber: 1,
          swimmerName: "Only Results",
          time: "28.50",
          place: 1,
          isDq: false,
          dateOfBirth: "2012-04-01",
          gender: "female",
        },
      ],
      relays: [],
    };
    const parsed = parseHy3(exportHy3(meet));
    const entry = parsed.entries.find((e) => e.swimmerName === "Only Results");
    expect(entry).toBeTruthy();
    const result = parsed.results.find((r) => r.swimmerName === "Only Results");
    expect(result).toMatchObject({ time: "28.50", place: 1 });
  });

  it("round-trips prelim/swimoff result rounds and heat/lane", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [{ eventNumber: 1, swimmerName: "Heat Swimmer" }],
      results: [
        {
          eventNumber: 1,
          swimmerName: "Heat Swimmer",
          time: "28.00",
          resultType: "prelim",
          heat: 3,
          lane: 4,
        },
        {
          eventNumber: 1,
          swimmerName: "Heat Swimmer",
          time: "27.90",
          resultType: "swimoff",
          heat: 1,
          lane: 2,
        },
      ],
      relays: [],
    };
    const parsed = parseHy3(exportHy3(meet));
    const prelim = parsed.results.find((r) => r.resultType === "prelim");
    const swimoff = parsed.results.find((r) => r.resultType === "swimoff");
    expect(prelim).toMatchObject({ heat: 3, lane: 4 });
    expect(swimoff).toMatchObject({ heat: 1, lane: 2 });
  });

  it("marks exhibition entries and falls back to the 'A' stroke letter for unmapped strokes", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [
        { eventNumber: 6, swimmerName: "Odd Stroke", exhibition: true },
      ],
      results: [],
      relays: [],
    };
    const parsed = parseHy3(exportHy3(meet));
    const entry = parsed.entries.find((e) => e.swimmerName === "Odd Stroke");
    expect(entry?.exhibition).toBe(true);
  });

  it("treats a blank swimmer name as an empty first/last name (no crash)", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [{ eventNumber: 1, swimmerName: "   " }],
      results: [],
      relays: [],
    };
    expect(() => exportHy3(meet)).not.toThrow();
  });

  it("blanks out unparseable dates and non-finite/zero seed times instead of throwing", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      startDate: "not-a-date",
      entries: [{ eventNumber: 1, swimmerName: "No Seed", seedTime: "NT" }],
      results: [],
      relays: [],
    };
    const text = exportHy3(meet);
    const parsed = parseHy3(text);
    expect(parsed.startDate).toBeUndefined();
    const entry = parsed.entries.find((e) => e.swimmerName === "No Seed");
    expect(entry?.seedTime).toBeUndefined();
  });
});

describe("exportCl2", () => {
  it("round-trips entries, results (incl. DQ), and relay legs through parseCl2Meet", () => {
    const text = exportCl2(baseMeet);
    expect(text).toContain("A0");
    expect(text).toContain("D0");
    expect(text).toContain("G0");
    expect(text).toContain("E0");
    expect(text).toContain("F0");

    expect(detectCl2FileKind(text)).toBe("meet_results");

    const parsed = parseCl2Meet(text);
    expect(parsed.name).toBe("Test Meet");
    expect(parsed.importKind).toBe("results");
    expect(parsed.entries.length).toBeGreaterThanOrEqual(2);
    expect(parsed.results.length).toBe(2);

    const adaResult = parsed.results.find((r) => r.swimmerName.includes("Ada"));
    expect(adaResult).toMatchObject({ time: "27.50", place: 1, isDq: false });

    const bobResult = parsed.results.find((r) => r.swimmerName.includes("Bob"));
    expect(bobResult?.isDq).toBe(true);

    expect(parsed.relays?.length).toBe(1);
    expect(parsed.relays?.[0]?.swimmerNames.length).toBe(4);
  });

  it("labels entries-only packs for round-trip detection", () => {
    const entriesOnly = exportCl2({ ...baseMeet, results: [], relays: [] });
    expect(detectCl2FileKind(entriesOnly)).toBe("meet_entries");
    expect(parseCl2Meet(entriesOnly).importKind).toBe("entries");
  });

  it("labels an empty roster-only pack distinctly from entries/results", () => {
    const rosterOnly = exportCl2({
      ...baseMeet,
      importKind: "roster",
      entries: [],
      results: [],
      relays: [],
    });
    expect(rosterOnly).toContain("Swimmers Only");
    expect(detectCl2FileKind("B1 only file\nD0 data")).toBe("unknown");
    expect(detectCl2FileKind("A01V3      02Custom Export                 Hy-Tek")).toBe(
      "unknown",
    );
    expect(
      detectCl2FileKind("A01V3      02Team Roster                   Hy-Tek"),
    ).toBe("swimmers_only");
  });

  it("falls back to a '1' stroke digit and skips events with no eventNumber", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      events: [
        ...baseMeet.events,
        { distance: 25, stroke: "free", gender: "female", eventKey: "no-num" },
      ],
      entries: [
        { eventNumber: 6, swimmerName: "Odd Stroke Swimmer" },
        { swimmerName: "No Event Number Entry" },
      ],
      results: [],
      relays: [],
    };
    expect(() => exportCl2(meet)).not.toThrow();
    const text = exportCl2(meet);
    expect(text).toContain("Odd Stroke Swimmer".split(" ")[0]);
  });

  it("uses a medley-relay event code and 'F' gender letter for a female relay", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      events: [
        ...baseMeet.events,
        {
          eventNumber: 20,
          distance: 200,
          stroke: "medley_relay",
          gender: "female",
          eventKey: "medley-relay",
        },
      ],
      entries: [],
      results: [],
      relays: [
        {
          eventNumber: 20,
          swimmerNames: ["Rel One", "Rel Two", "Rel Three", "Rel Four"],
        },
      ],
    };
    const text = exportCl2(meet);
    expect(text).toContain("F 2008");
  });

  it("omits the seed-time and relay-seed suffixes when absent", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [{ eventNumber: 1, swimmerName: "No Seed Cl2" }],
      results: [],
      relays: [{ eventNumber: 10, swimmerNames: ["A", "B", "C", "D"] }],
    };
    expect(() => exportCl2(meet)).not.toThrow();
  });

  it("uses a mixed-gender event's identity fallback and carries the USA ID from a result-only identity", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [
        { eventNumber: 3, swimmerName: "Bob Baker", gender: undefined },
      ],
      results: [
        {
          eventNumber: 3,
          swimmerName: "Bob Baker",
          time: "2:10.00",
          usaMemberId: "USA999",
          gender: "male",
        },
      ],
      relays: [],
    };
    const text = exportCl2(meet);
    expect(text).toContain("USA999");
  });

  it("round-trips results without an eventNumber or place", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [],
      results: [{ swimmerName: "No Event Number", time: "31.00" }],
      relays: [{ swimmerNames: ["A", "B", "C", "D"] }],
    };
    expect(() => exportCl2(meet)).not.toThrow();
    const text = exportCl2(meet);
    expect(text).toContain("No");
  });

  it("round-trips prelim/finals round markers on CL2 G0 results", () => {
    const meet: ParsedMeet = {
      ...baseMeet,
      entries: [{ eventNumber: 1, swimmerName: "Round Swimmer" }],
      results: [
        {
          eventNumber: 1,
          swimmerName: "Round Swimmer",
          time: "28.00",
          resultType: "prelim",
          heat: 3,
          lane: 4,
        },
        {
          eventNumber: 1,
          swimmerName: "Round Swimmer",
          time: "27.50",
          resultType: "finals",
          heat: 1,
          lane: 5,
        },
      ],
      relays: [],
    };
    const parsed = parseCl2Meet(exportCl2(meet));
    const prelim = parsed.results.find((r) => r.resultType === "prelim");
    const finals = parsed.results.find((r) => r.resultType === "finals");
    expect(prelim?.time).toBe("28.00");
    expect(finals?.time).toBe("27.50");
  });

  it("re-exports azsi-results.cl2 with comparable result counts", () => {
    const content = readFileSync(
      join(fixturesDir, "azsi-results.cl2"),
      "utf8",
    );
    const imported = parseCl2Meet(content);
    const reexported = parseCl2Meet(exportCl2(imported));
    expect(reexported.results.length).toBeGreaterThan(0);
    expect(reexported.results.length).toBe(imported.results.length);
    expect(reexported.results.some((r) => r.resultType === "prelim")).toBe(
      true,
    );
    expect(reexported.results.some((r) => r.resultType === "finals")).toBe(
      true,
    );
  });

  it("uses SCM/LCM course tokens", () => {
    expect(exportCl2({ ...baseMeet, course: "SCM" })).toContain("SCM");
    expect(exportCl2({ ...baseMeet, course: "LCM" })).toContain("LCM");
  });
});

describe("exportHyv", () => {
  it("round-trips event catalog (incl. dive) through parseHyv", () => {
    const meet: ParsedMeet = {
      name: "HYV Meet",
      course: "SCY",
      location: "Test Pool",
      startDate: "2025-03-01",
      endDate: "2025-03-02",
      events: [
        {
          eventNumber: 11,
          distance: 50,
          stroke: "free",
          gender: "female",
          ageGroup: "13-14",
          eventKey: "50_free_scy_f",
          roundType: "prelim",
          qualifyingTimeMs: 28_500,
        },
        {
          eventNumber: 42,
          distance: 0,
          stroke: "dive",
          gender: "male",
          ageGroup: "15-18",
          eventKey: "dive-42",
          eventKind: "dive",
          diveCount: 6,
          roundType: "finals",
        },
      ],
      entries: [],
      results: [],
    };
    const parsed = parseHyv(exportHyv(meet));
    expect(parsed.name).toBe("HYV Meet");
    expect(parsed.location).toBe("Test Pool");
    expect(parsed.startDate).toBe("2025-03-01");
    expect(parsed.endDate).toBe("2025-03-02");
    expect(parsed.course).toBe("SCY");

    const swim = parsed.events.find((e) => e.eventNumber === 11);
    expect(swim).toMatchObject({
      distance: 50,
      stroke: "free",
      gender: "female",
      ageGroup: "13-14",
      roundType: "prelim",
      qualifyingTimeMs: 28_500,
    });

    const dive = parsed.events.find((e) => e.eventKind === "dive");
    expect(dive).toMatchObject({
      eventNumber: 42,
      diveCount: 6,
      roundType: "finals",
    });
  });

  it("covers SCM/LCM headers, relays, swimoff rounds, and unknown strokes", () => {
    const meet: ParsedMeet = {
      name: "HYV Relay",
      course: "LCM",
      events: [
        {
          eventNumber: 1,
          distance: 200,
          stroke: "free_relay",
          gender: "mixed",
          eventKey: "x",
          roundType: "swimoff",
        },
        {
          eventNumber: 2,
          distance: 200,
          stroke: "medley_relay",
          gender: "male",
          eventKey: "x",
        },
        {
          eventNumber: 3,
          distance: 50,
          stroke: "unknown_stroke",
          gender: "female",
          eventKey: "x",
        },
      ],
      entries: [],
      results: [],
    };
    const parsed = parseHyv(exportHyv(meet));
    expect(parsed.course).toBe("LCM");
    expect(parsed.events.find((e) => e.eventNumber === 1)?.roundType).toBe(
      "swimoff",
    );
    expect(parsed.events.find((e) => e.eventNumber === 2)?.stroke).toBe(
      "medley_relay",
    );

    const scm = parseHyv(exportHyv({ ...meet, course: "SCM" }));
    expect(scm.course).toBe("SCM");
  });

  it("exports time-trial rounds, invalid header dates, sparse event numbers, and dives", () => {
    const meet: ParsedMeet = {
      name: "Sparse HYV",
      course: "SCY",
      startDate: "not-a-date",
      endDate: "also-bad",
      events: [
        {
          distance: 50,
          stroke: "free",
          gender: "male",
          eventKey: "no-num",
          roundType: "time_trial",
        },
        {
          eventNumber: 9,
          distance: 0,
          stroke: "dive",
          gender: "female",
          eventKey: "dive-9",
          eventKind: "dive",
          diveCount: 5,
        },
        {
          eventNumber: 10,
          distance: 0,
          stroke: "dive",
          gender: "male",
          eventKey: "dive-10",
          eventKind: "dive",
        },
      ],
      entries: [],
      results: [],
    };
    const text = exportHyv(meet);
    expect(text).toContain(";X;");
    expect(text).toContain(";0;");
    expect(text).toContain(";5;6;");
    expect(text).toContain(";0;6;");
    expect(text.startsWith("Sparse HYV;")).toBe(true);
    expect(text).toContain(";Y;");

    const parsed = parseHyv(text);
    expect(parsed.events.find((e) => e.roundType === "time_trial")).toBeTruthy();
    expect(parsed.events.find((e) => e.eventKind === "dive")).toMatchObject({
      diveCount: 5,
    });
  });
});

describe("exportEv3", () => {
  it("round-trips event catalog (incl. dive) through parseEv3", () => {
    const meet: ParsedMeet = {
      name: "Events Meet",
      course: "SCY",
      startDate: "2026-01-10",
      endDate: "2026-01-11",
      events: [
        {
          eventNumber: 1,
          distance: 50,
          stroke: "free",
          gender: "female",
          eventKey: "x",
        },
        {
          eventNumber: 2,
          distance: 200,
          stroke: "im",
          gender: "male",
          eventKey: "x",
        },
        {
          eventNumber: 3,
          distance: 200,
          stroke: "free_relay",
          gender: "mixed",
          eventKey: "x",
        },
        {
          eventNumber: 4,
          distance: 200,
          stroke: "medley_relay",
          gender: "mixed",
          eventKey: "x",
        },
        {
          eventNumber: 5,
          distance: 0,
          stroke: "dive",
          gender: "female",
          eventKey: "dive-5",
          eventKind: "dive",
          diveCount: 6,
        },
      ],
      entries: [],
      results: [],
      entryLimits: {
        maxIndividualEntries: 3,
        maxRelayEntries: 2,
        maxCombinedEntries: 4,
      },
      entryDeadline: "2026-01-05",
    };
    const text = exportEv3(meet);
    const parsed = parseEv3(text);

    expect(parsed.name).toBe("Events Meet");
    expect(parsed.startDate).toBe("2026-01-10");
    expect(parsed.entryLimits).toEqual({
      maxIndividualEntries: 3,
      maxRelayEntries: 2,
      maxCombinedEntries: 4,
    });
    expect(parsed.events.length).toBe(5);

    const free = parsed.events.find((e) => e.eventNumber === 1);
    expect(free).toMatchObject({
      distance: 50,
      stroke: "free",
      gender: "female",
    });

    const freeRelay = parsed.events.find((e) => e.eventNumber === 3);
    expect(freeRelay?.stroke).toBe("free_relay");
    const medleyRelay = parsed.events.find((e) => e.eventNumber === 4);
    expect(medleyRelay?.stroke).toBe("medley_relay");

    const dive = parsed.events.find((e) => e.eventNumber === 5);
    expect(dive).toMatchObject({
      eventKind: "dive",
      stroke: "dive",
      distance: 0,
      diveCount: 6,
      gender: "female",
    });
    expect(parsed.skippedDiveEvents).toBe(undefined);
  });

  it("exports age bands, QT cuts, and empty-name slug safely", () => {
    const meet: ParsedMeet = {
      name: "!!!",
      course: "LCM",
      events: [
        {
          eventNumber: 1,
          distance: 100,
          stroke: "back",
          gender: "female",
          eventKey: "x",
          ageGroup: "15&O",
          qualifyingTimeMs: 65000,
        },
        {
          eventNumber: 2,
          distance: 50,
          stroke: "fly",
          gender: "male",
          eventKey: "x",
          ageGroup: "10&U",
        },
        {
          eventNumber: 3,
          distance: 200,
          stroke: "breast",
          gender: "mixed",
          eventKey: "x",
          ageGroup: "13-14",
        },
        {
          eventNumber: 4,
          distance: 50,
          stroke: "free",
          gender: "male",
          eventKey: "x",
          ageGroup: "Open",
        },
      ],
      entries: [],
      results: [],
    };
    const text = exportEv3(meet);
    expect(text).toContain("65.00");
    const parsed = parseEv3(text);
    expect(parsed.course).toBe("LCM");
    expect(parsed.events.some((e) => e.ageGroup?.includes("15"))).toBe(true);

    const zip = exportMeetZip(meet, "events");
    const bundle = extractAllMeetFilesFromZip(zip);
    expect(bundle.files.some((f) => f.filename.includes("meet"))).toBe(true);
  });

  it("defaults an event with no eventNumber to 0 and a dive event with no diveCount to 0", () => {
    const meet: ParsedMeet = {
      name: "Sparse Events",
      course: "SCM",
      events: [
        { distance: 50, stroke: "free", gender: "male", eventKey: "x" },
        {
          distance: 0,
          stroke: "dive",
          gender: "female",
          eventKey: "dive-x",
          eventKind: "dive",
        },
      ],
      entries: [],
      results: [],
    };
    expect(() => exportEv3(meet)).not.toThrow();
    const parsed = parseEv3(exportEv3(meet));
    expect(parsed.course).toBe("SCM");
    const dive = parsed.events.find((e) => e.eventKind === "dive");
    expect(dive?.diveCount).toBeUndefined();
  });
});

describe("exportCl2 results-only athletes", () => {
  it("emits D0 rows for result swimmers not already in entries", () => {
    const meet: ParsedMeet = {
      name: "Results Only",
      course: "SCY",
      events: [
        {
          eventNumber: 7,
          distance: 50,
          stroke: "free",
          gender: "female",
          eventKey: "x",
        },
      ],
      entries: [],
      results: [
        {
          eventNumber: 7,
          swimmerName: "Only Results",
          time: "28.50",
          place: 1,
          dateOfBirth: "2012-04-01",
          gender: "female",
          usaMemberId: "040112ONLYRES",
        },
      ],
    };
    const text = exportCl2(meet);
    expect(text).toContain("D0");
    expect(text).toContain("Only");
    expect(text).toContain("G0");
    expect(text).toContain("28.50");
  });
});

describe("exportMeetZip", () => {
  it("packs HY3+CL2 for entries/results and EV3+HY3+CL2 for events", () => {
    const resultsZip = exportMeetZip(baseMeet, "results");
    const bundle = extractAllMeetFilesFromZip(resultsZip);
    expect(bundle.files.map((f) => f.format).sort()).toEqual(["cl2", "hy3"]);

    const eventsZip = exportMeetZip(baseMeet, "events");
    const eventsBundle = extractAllMeetFilesFromZip(eventsZip);
    expect(eventsBundle.files.map((f) => f.format).sort()).toEqual([
      "cl2",
      "ev3",
      "hy3",
      "hyv",
    ]);
    expect(eventsBundle.primary.format).toBe("ev3");
  });
});
