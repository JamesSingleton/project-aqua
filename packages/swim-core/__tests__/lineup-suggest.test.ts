import { describe, expect, it } from "vitest";
import { suggestIndividualLineup } from "../src/lineup-suggest";

const events = [
  {
    id: "e100free",
    eventKey: "100_free_scy_m",
    stroke: "free",
    gender: "male",
    qualifyingTimeMs: 55_000,
  },
  {
    id: "e200free",
    eventKey: "200_free_scy_m",
    stroke: "free",
    gender: "male",
    qualifyingTimeMs: null,
  },
  {
    id: "e50back",
    eventKey: "50_back_scy_m",
    stroke: "back",
    gender: "male",
    qualifyingTimeMs: null,
  },
  {
    id: "e100fly",
    eventKey: "100_fly_scy_m",
    stroke: "fly",
    gender: "male",
    qualifyingTimeMs: null,
  },
  {
    id: "eRelay",
    eventKey: "200_free_relay_scy_m",
    stroke: "free_relay",
    gender: "male",
    qualifyingTimeMs: null,
  },
  {
    id: "eGirls",
    eventKey: "100_free_scy_f",
    stroke: "free",
    gender: "female",
    qualifyingTimeMs: null,
  },
];

const male = {
  membershipId: "m1",
  gender: "male" as const,
  bestByEventKey: {
    "100_free_scy_m": 58_000,
    "200_free_scy_m": 125_000,
    "50_back_scy_m": 32_000,
  },
};

describe("suggestIndividualLineup", () => {
  it("returns empty when the meet has no individual events", () => {
    expect(
      suggestIndividualLineup({
        events: [events[4]!],
        candidates: [male],
        existing: [],
        limits: null,
      }).entries,
    ).toEqual([]);
  });

  it("skips relays, ineligible genders, and already entered events", () => {
    const { entries } = suggestIndividualLineup({
      events,
      candidates: [male],
      existing: [
        {
          membershipId: "m1",
          meetEventId: "e200free",
          eventKey: "200_free_scy_m",
          stroke: "free",
          status: "approved",
        },
        {
          membershipId: "m1",
          meetEventId: "e50back",
          eventKey: "50_back_scy_m",
          stroke: "back",
          status: "scratched",
        },
      ],
      limits: {
        maxIndividualEntries: 3,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      },
    });

    expect(entries.every((e) => e.meetEventId !== "eRelay")).toBe(true);
    expect(entries.every((e) => e.meetEventId !== "eGirls")).toBe(true);
    expect(entries.every((e) => e.meetEventId !== "e200free")).toBe(true);
    expect(entries.some((e) => e.meetEventId === "e50back")).toBe(true);
  });

  it("prefers fastest times, warns on QT, and uses NT when no best exists", () => {
    const { entries } = suggestIndividualLineup({
      events: events.filter(
        (e) => e.gender === "male" && e.stroke !== "free_relay",
      ),
      candidates: [male],
      existing: [],
      limits: {
        maxIndividualEntries: 3,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      },
    });

    expect(entries).toHaveLength(3);
    expect(entries[0]?.meetEventId).toBe("e50back");
    expect(entries[0]?.seedTimeSource).toBe("personal_best");
    const free = entries.find((e) => e.meetEventId === "e100free");
    expect(free?.warning).toContain("qualifying");
    expect(entries.some((e) => e.meetEventId === "e200free")).toBe(true);
  });

  it("stops when combined or package limits are reached", () => {
    const limited = suggestIndividualLineup({
      events: events.filter(
        (e) => e.gender === "male" && !e.eventKey.includes("relay"),
      ),
      candidates: [male],
      existing: [
        {
          membershipId: "m1",
          meetEventId: "other",
          stroke: "free",
          status: "approved",
        },
      ],
      limits: {
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: 2,
        entryLimitPackages: null,
      },
    });
    expect(limited.entries).toHaveLength(1);

    const packaged = suggestIndividualLineup({
      events: events.filter(
        (e) => e.gender === "male" && !e.eventKey.includes("relay"),
      ),
      candidates: [male],
      existing: [],
      limits: {
        maxIndividualEntries: null,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: [{ individual: 1, relay: 1 }],
      },
    });
    expect(packaged.entries).toHaveLength(1);
  });

  it("skips a swimmer when max individual entries is zero", () => {
    expect(
      suggestIndividualLineup({
        events: events.filter((e) => e.gender === "male"),
        candidates: [male],
        existing: [],
        limits: {
          maxIndividualEntries: 0,
          maxRelayEntries: null,
          maxCombinedEntries: null,
          entryLimitPackages: null,
        },
      }).entries,
    ).toEqual([]);
  });

  it("allows mixed events for any gender", () => {
    const mixed = {
      id: "emix",
      eventKey: "200_im_scy_x",
      stroke: "im",
      gender: "mixed",
      qualifyingTimeMs: null,
    };
    const { entries } = suggestIndividualLineup({
      events: [mixed],
      candidates: [male],
      existing: [],
      limits: {
        maxIndividualEntries: 1,
        maxRelayEntries: null,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      },
    });
    expect(entries[0]?.meetEventId).toBe("emix");
  });

  it("counts existing relays and ignores other swimmers when ranking NT events", () => {
    const second = {
      membershipId: "m2",
      gender: "male" as const,
      bestByEventKey: { "200_free_scy_m": 120_000 },
    };
    const { entries } = suggestIndividualLineup({
      events: [
        {
          id: "eNtA",
          eventKey: "100_fly_scy_m",
          stroke: "fly",
          gender: "male",
          qualifyingTimeMs: null,
        },
        {
          id: "eNtB",
          eventKey: "50_back_scy_m",
          stroke: "back",
          gender: "male",
          qualifyingTimeMs: null,
        },
        {
          id: "eTimed",
          eventKey: "200_free_scy_m",
          stroke: "free",
          gender: "male",
          qualifyingTimeMs: null,
        },
      ],
      candidates: [
        {
          membershipId: "m1",
          gender: "male",
          bestByEventKey: {},
        },
        second,
      ],
      existing: [
        {
          membershipId: "m2",
          meetEventId: "eRelay",
          eventKey: "200_free_relay_scy_m",
          stroke: "free_relay",
          status: "approved",
        },
        {
          membershipId: "m1",
          meetEventId: "ignored",
          stroke: "free",
          status: "approved",
        },
      ],
      limits: {
        maxIndividualEntries: 2,
        maxRelayEntries: 4,
        maxCombinedEntries: null,
        entryLimitPackages: null,
      },
    });

    expect(entries.filter((e) => e.membershipId === "m2")[0]?.meetEventId).toBe(
      "eTimed",
    );
    expect(entries.filter((e) => e.membershipId === "m1").length).toBe(1);
  });

  it("caps at the default individual count when the meet has no max", () => {
    const extra = {
      ...male,
      bestByEventKey: {},
    };
    const { entries } = suggestIndividualLineup({
      events: events.filter(
        (e) => e.gender === "male" && !e.eventKey.includes("relay"),
      ),
      candidates: [extra],
      existing: [],
      limits: null,
    });
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.seedTimeSource === "no_time")).toBe(true);
  });
});
