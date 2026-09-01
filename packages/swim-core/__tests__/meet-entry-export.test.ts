import { describe, expect, it } from "vitest";
import { buildByEventCsv, buildEntryListCsv } from "../src/meet-entry-export";

const events = [
  {
    id: "e1",
    eventNumber: 1,
    stroke: "free",
    distance: 50,
    gender: "female",
    ageGroup: null,
    eventKey: "50_free_scy_f",
  },
  {
    id: "e2",
    eventNumber: 2,
    stroke: "free_relay",
    distance: 200,
    gender: "female",
    ageGroup: null,
    eventKey: "200_free_relay_scy_f",
  },
];

describe("buildEntryListCsv", () => {
  it("exports individuals and one relay row with four legs", () => {
    const csv = buildEntryListCsv({
      events,
      entries: [
        {
          id: "en1",
          meetEventId: "e1",
          membershipId: "m1",
          firstName: "Alex",
          lastName: "Smith",
          seedTimeMs: 28500,
          exhibition: false,
          entryNotes: null,
          status: "approved",
          stroke: "free",
          eventKey: "50_free_scy_f",
        },
      ],
      relayLegs: [
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m1",
          firstName: "Alex",
          lastName: "Smith",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 2,
          membershipId: "m2",
          firstName: "Blair",
          lastName: "Jones",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 3,
          membershipId: "m3",
          firstName: "Casey",
          lastName: "Lee",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 4,
          membershipId: "m4",
          firstName: "Dana",
          lastName: "Ng",
        },
      ],
    });

    expect(csv).toContain("Alex Smith");
    expect(csv).toContain("Relay A");
    expect(csv).toContain("Alex Smith,Blair Jones,Casey Lee,Dana Ng");
    expect(csv.match(/Alex Smith/g)?.length).toBe(2);
  });

  it("skips scratched entries", () => {
    const csv = buildEntryListCsv({
      events: [events[0]!],
      entries: [
        {
          id: "en1",
          meetEventId: "e1",
          membershipId: "m1",
          firstName: "Alex",
          lastName: "Smith",
          seedTimeMs: null,
          exhibition: false,
          entryNotes: null,
          status: "scratched",
          stroke: "free",
          eventKey: "50_free_scy_f",
        },
      ],
      relayLegs: [],
    });

    expect(csv.trim().split("\n")).toHaveLength(1);
  });
});

describe("buildByEventCsv", () => {
  it("groups relay legs on one row", () => {
    const csv = buildByEventCsv({
      events: [events[1]!],
      entries: [],
      relayLegs: [
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m1",
          firstName: "Alex",
          lastName: "Smith",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 2,
          membershipId: "m2",
          firstName: "Blair",
          lastName: "Jones",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 3,
          membershipId: "m3",
          firstName: "Casey",
          lastName: "Lee",
        },
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 4,
          membershipId: "m4",
          firstName: "Dana",
          lastName: "Ng",
        },
      ],
    });

    const lines = csv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Alex Smith,Blair Jones,Casey Lee,Dana Ng");
  });
});
