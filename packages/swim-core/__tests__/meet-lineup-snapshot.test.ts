import { describe, expect, it } from "vitest";
import {
  type BuildMeetLineupSnapshotInput,
  buildMeetLineupSnapshot,
  formatMeetLineupCsv,
  hostPackLineup,
  isHostPackExcluded,
  type MeetLineupMember,
} from "../src/meet-lineup-snapshot";

const alex: MeetLineupMember = {
  membershipId: "m1",
  swimmerId: "s1",
  firstName: "Alex",
  lastName: "Smith",
  dateOfBirth: "2010-01-01",
  gender: "female",
  governingBodyId: "123",
  classYear: "JR",
  eligibilityStatus: "competing",
};

const blair: MeetLineupMember = {
  membershipId: "m2",
  swimmerId: "s2",
  firstName: "Blair",
  lastName: "Jones",
  gender: "female",
  eligibilityStatus: "competing",
};

const casey: MeetLineupMember = {
  membershipId: "m3",
  swimmerId: "s3",
  firstName: "Casey",
  lastName: "Lee",
  gender: "female",
  eligibilityStatus: "ineligible",
};

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
    ageGroup: "13-14",
    eventKey: "200_free_relay_scy_f",
  },
];

function baseInput(
  overrides: Partial<BuildMeetLineupSnapshotInput> = {},
): BuildMeetLineupSnapshotInput {
  return {
    meet: {
      name: "Invite",
      startDate: "2026-09-12",
      endDate: "2026-09-13",
      course: "SCY",
      location: "Chandler",
    },
    team: {
      name: "Maricopa",
      teamCode: "MARI",
      lscCode: "AZ",
      teamType: "high_school",
      addressLine1: "1 Main",
      contactName: "Coach",
      contactEmail: "c@x.com",
    },
    events,
    entries: [
      {
        id: "en1",
        meetEventId: "e1",
        membershipId: "m1",
        seedTimeMs: 28500,
        exhibition: false,
        entryNotes: null,
        status: "approved",
      },
    ],
    relayLegs: [
      {
        meetEventId: "e2",
        relayLetter: "A",
        legOrder: 1,
        membershipId: "m1",
      },
      {
        meetEventId: "e2",
        relayLetter: "A",
        legOrder: 2,
        membershipId: "m2",
      },
    ],
    relayTeams: [{ meetEventId: "e2", relayLetter: "A", seedTimeMs: 112_540 }],
    members: [alex, blair, casey],
    ...overrides,
  };
}

describe("buildMeetLineupSnapshot", () => {
  it("groups relays once and keeps inclusion as data", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        commitments: [{ membershipId: "m2", status: "not_going" }],
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m1",
            seedTimeMs: 28500,
            exhibition: true,
            entryNotes: "note",
            status: "approved",
          },
          {
            id: "en2",
            meetEventId: "e1",
            membershipId: "m3",
            seedTimeMs: null,
            exhibition: false,
            status: "approved",
          },
          {
            id: "en-relay",
            meetEventId: "e2",
            membershipId: "m1",
            seedTimeMs: null,
            exhibition: false,
            status: "approved",
          },
        ],
      }),
    );

    expect(snapshot.meet.startDate).toBe("2026-09-12");
    expect(snapshot.meet.endDate).toBe("2026-09-13");
    expect(snapshot.team.teamKind).toBe("HS");
    expect(snapshot.events[0]?.isRelay).toBe(false);
    expect(snapshot.events[1]?.isRelay).toBe(true);
    expect(snapshot.individuals).toHaveLength(2);
    expect(
      snapshot.individuals.find((row) => row.membershipId === "m3")?.inclusion,
    ).toEqual({
      scratched: false,
      notGoing: false,
      ineligible: true,
      missingFromRoster: false,
    });
    expect(snapshot.relayTeams).toHaveLength(1);
    expect(snapshot.relayTeams[0]?.letter).toBe("A");
    expect(snapshot.relayTeams[0]?.seedTimeMs).toBe(112_540);
    expect(snapshot.relayTeams[0]?.legs[1]?.inclusion.notGoing).toBe(true);
    expect(
      snapshot.athletes.find((row) => row.membershipId === "m2")?.relayOnly,
    ).toBe(true);
  });

  it("accepts Date meet days and derives a packed relay letter", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        meet: {
          name: "Invite",
          startDate: new Date(Date.UTC(2026, 8, 12)),
          endDate: "",
          course: "LCM",
          location: "  ",
        },
        team: { teamType: "club", teamCode: "  " },
        events: [
          {
            id: "z",
            eventNumber: null,
            stroke: "medley_relay",
            distance: 200,
            gender: "mixed",
            eventKey: "200_medley_relay_lcm_x",
          },
          {
            id: "a",
            eventNumber: null,
            stroke: "free",
            distance: 50,
            gender: "other",
            eventKey: "50_free_lcm_m",
          },
        ],
        entries: [],
        relayLegs: [
          {
            meetEventId: "z",
            relayLetter: null,
            legOrder: 5,
            membershipId: "ghost",
          },
        ],
        relayTeams: [],
        members: [],
      }),
    );

    expect(snapshot.meet.startDate).toBe("2026-09-12");
    expect(snapshot.meet.endDate).toBeUndefined();
    expect(snapshot.meet.location).toBeUndefined();
    expect(snapshot.team.teamKind).toBeUndefined();
    expect(snapshot.team.teamCode).toBeUndefined();
    expect(snapshot.events.map((event) => event.id)).toEqual(["a", "z"]);
    expect(snapshot.relayTeams[0]?.letter).toBe("B");
    expect(snapshot.relayTeams[0]?.legs[0]?.firstName).toBe("Unknown");
    expect(snapshot.athletes[0]?.inclusion.missingFromRoster).toBe(true);
    expect(snapshot.athletes[0]?.name).toBe("Unknown");
  });

  it("marks scratched-only athletes and sorts events by number", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        events: [
          { ...events[1]!, eventNumber: 9 },
          { ...events[0]!, eventNumber: 3 },
        ],
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m1",
            seedTimeMs: 0,
            exhibition: false,
            status: "scratched",
          },
        ],
        relayLegs: [],
        relayTeams: [],
        members: [{ ...alex, gender: undefined, classYear: "  " }],
      }),
    );

    expect(snapshot.events.map((event) => event.id)).toEqual(["e1", "e2"]);
    expect(snapshot.individuals[0]?.inclusion.scratched).toBe(true);
    expect(snapshot.athletes[0]?.inclusion.scratched).toBe(true);
    expect(snapshot.athletes[0]?.gender).toBeUndefined();
    expect(snapshot.athletes[0]?.classYear).toBeUndefined();
  });

  it("sorts relay teams by event then letter", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        events: [
          events[1]!,
          {
            id: "e3",
            eventNumber: 4,
            stroke: "medley_relay",
            distance: 200,
            gender: "female",
            eventKey: "200_medley_relay_scy_f",
          },
        ],
        entries: [],
        relayLegs: [
          {
            meetEventId: "e3",
            relayLetter: "A",
            legOrder: 1,
            membershipId: "m1",
          },
          {
            meetEventId: "e2",
            relayLetter: "B",
            legOrder: 1,
            membershipId: "m2",
          },
          {
            meetEventId: "e2",
            relayLetter: "A",
            legOrder: 1,
            membershipId: "m1",
          },
        ],
        relayTeams: [],
      }),
    );

    expect(
      snapshot.relayTeams.map((team) => `${team.meetEventId}:${team.letter}`),
    ).toEqual(["e2:A", "e2:B", "e3:A"]);
  });
});

describe("hostPackLineup", () => {
  it("is a filter: paper still has not-going, host pack does not", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        commitments: [{ membershipId: "m2", status: "not_going" }],
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m1",
            seedTimeMs: 28500,
            exhibition: false,
            status: "approved",
          },
          {
            id: "en2",
            meetEventId: "e1",
            membershipId: "m3",
            seedTimeMs: null,
            exhibition: false,
            status: "approved",
          },
        ],
      }),
    );

    expect(snapshot.individuals.some((row) => row.membershipId === "m3")).toBe(
      true,
    );
    expect(snapshot.relayTeams[0]?.legs).toHaveLength(2);

    const host = hostPackLineup(snapshot);
    expect(host.individuals.map((row) => row.membershipId)).toEqual(["m1"]);
    expect(host.relayTeams[0]?.legs.map((leg) => leg.membershipId)).toEqual([
      "m1",
    ]);
    expect(host.athletes.map((row) => row.membershipId)).toEqual(["m1"]);
    expect(isHostPackExcluded(snapshot.relayTeams[0]!.legs[1]!.inclusion)).toBe(
      true,
    );
  });

  it("recomputes relayOnly when an individual is dropped but the relay remains", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m2",
            seedTimeMs: 30000,
            exhibition: false,
            status: "scratched",
          },
        ],
        commitments: [],
      }),
    );

    expect(
      snapshot.athletes.find((row) => row.membershipId === "m2")?.relayOnly,
    ).toBe(true);

    const host = hostPackLineup(snapshot);
    expect(host.individuals).toEqual([]);
    expect(
      host.athletes.find((row) => row.membershipId === "m2")?.relayOnly,
    ).toBe(true);
  });

  it("drops a relay team when every leg is excluded", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        entries: [],
        relayLegs: [
          {
            meetEventId: "e2",
            relayLetter: "A",
            legOrder: 1,
            membershipId: "m3",
          },
        ],
        members: [casey],
      }),
    );

    const host = hostPackLineup(snapshot);
    expect(host.relayTeams).toEqual([]);
    expect(host.athletes).toEqual([]);
  });
});

describe("isHostPackExcluded", () => {
  it("treats missing roster and ineligible as host exclusions", () => {
    expect(
      isHostPackExcluded({
        scratched: false,
        notGoing: false,
        ineligible: false,
        missingFromRoster: false,
      }),
    ).toBe(false);
    expect(
      isHostPackExcluded({
        scratched: false,
        notGoing: false,
        ineligible: true,
        missingFromRoster: false,
      }),
    ).toBe(true);
    expect(
      isHostPackExcluded({
        scratched: false,
        notGoing: false,
        ineligible: false,
        missingFromRoster: true,
      }),
    ).toBe(true);
  });
});

describe("formatMeetLineupCsv", () => {
  it("emits individuals and grouped relay legs without a second grouping", () => {
    const snapshot = buildMeetLineupSnapshot(baseInput());
    const csv = formatMeetLineupCsv(snapshot);
    expect(csv).toContain("Alex Smith");
    expect(csv).toContain("Relay A");
    expect(csv).toContain("Alex Smith,Blair Jones");
    expect(csv).toContain("1:52.54");
    expect(csv).toContain("13-14");
  });

  it("skips scratched rows but keeps not-going on paper CSV", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        commitments: [{ membershipId: "m1", status: "not_going" }],
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m1",
            seedTimeMs: null,
            exhibition: false,
            entryNotes: 'said "go", then no',
            status: "approved",
          },
          {
            id: "en2",
            meetEventId: "e1",
            membershipId: "m2",
            seedTimeMs: 0,
            exhibition: true,
            status: "scratched",
          },
        ],
        relayLegs: [],
        relayTeams: [],
      }),
    );

    const csv = formatMeetLineupCsv(snapshot);
    expect(csv).toContain("Alex Smith");
    expect(csv).toContain('said ""go"", then no');
    expect(csv).not.toContain("Blair Jones");
    expect(csv).not.toContain("Yes");
  });

  it("formats exhibition and empty seed cells", () => {
    const snapshot = buildMeetLineupSnapshot(
      baseInput({
        meet: {
          name: "Invite",
          startDate: "not-a-date-value",
          course: "SCM",
        },
        events: [
          {
            id: "e1",
            eventNumber: null,
            stroke: "free",
            distance: 50,
            gender: "female",
            eventKey: "50_free_scm_f",
          },
        ],
        entries: [
          {
            id: "en1",
            meetEventId: "e1",
            membershipId: "m1",
            seedTimeMs: 0,
            exhibition: true,
            status: "approved",
          },
        ],
        relayLegs: [],
        relayTeams: [],
      }),
    );

    expect(snapshot.meet.startDate).toBe("not-a-date");
    const csv = formatMeetLineupCsv(snapshot);
    expect(csv).toContain("Yes");
    expect(csv.split("\n")[1]).toContain(",,");
  });

  it("prints blank event number and age when a relay has neither", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: { name: "Invite", startDate: "2026-09-12", course: "SCY" },
      events: [
        {
          id: "e2",
          eventNumber: null,
          stroke: "free_relay",
          distance: 200,
          gender: "female",
          eventKey: "200_free_relay_scy_f",
        },
        {
          id: "e9",
          eventNumber: 9,
          stroke: "medley_relay",
          distance: 200,
          gender: "female",
          eventKey: "200_medley_relay_scy_f",
        },
      ],
      entries: [],
      relayLegs: [
        {
          meetEventId: "e2",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m1",
        },
      ],
      members: [alex],
    });

    const csv = formatMeetLineupCsv(snapshot);
    expect(csv).toContain("Relay A");
    expect(csv).not.toContain("Medley");
  });
});
