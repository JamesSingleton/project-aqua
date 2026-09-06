import { buildMeetLineupSnapshot } from "@project-aqua/swim-core/meet-lineup-snapshot";
import { describe, expect, it } from "vitest";
import { buildSplitSheetReport } from "../src/split-sheet/build";

describe("buildSplitSheetReport", () => {
  it("uses 25-split boxes on SCY 50s, omits scratches and relay alts by default", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "2026 Croswhite Invite",
        startDate: "2026-09-12",
        course: "SCY",
        location: "Chandler High School",
      },
      team: {
        name: "Maricopa High School",
        teamCode: "MARI",
        lscCode: "AZ",
        contactName: "Meg O'Brien",
      },
      events: [
        {
          id: "e1",
          eventNumber: 1,
          stroke: "medley_relay",
          distance: 200,
          gender: "male",
          eventKey: "200_medley_relay_scy_m",
        },
        {
          id: "e7",
          eventNumber: 7,
          stroke: "free",
          distance: 50,
          gender: "male",
          eventKey: "50_free_scy_m",
        },
        {
          id: "e8",
          eventNumber: 8,
          stroke: "free",
          distance: 50,
          gender: "female",
          eventKey: "50_free_scy_f",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e7",
          membershipId: "m-juan",
          seedTimeMs: 35_160,
          exhibition: false,
          status: "entered",
        },
        {
          id: "a2",
          meetEventId: "e7",
          membershipId: "m-antonio",
          seedTimeMs: null,
          exhibition: false,
          status: "entered",
        },
        {
          id: "a3",
          meetEventId: "e8",
          membershipId: "m-riley",
          seedTimeMs: null,
          exhibition: false,
          status: "scratched",
        },
      ],
      relayLegs: [
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m-orion",
        },
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 2,
          membershipId: "m-dante",
        },
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 5,
          membershipId: "m-ruben",
        },
        {
          meetEventId: "e1",
          relayLetter: "B",
          legOrder: 1,
          membershipId: "m-juan",
        },
      ],
      relayTeams: [
        { meetEventId: "e1", relayLetter: "A", seedTimeMs: 112_540 },
        { meetEventId: "e1", relayLetter: "B", seedTimeMs: null },
      ],
      members: [
        {
          membershipId: "m-juan",
          swimmerId: "s-juan",
          firstName: "Juan",
          lastName: "Trejo",
          gender: "male",
          classYear: "SR",
        },
        {
          membershipId: "m-antonio",
          swimmerId: "s-antonio",
          firstName: "Antonio",
          lastName: "Rodriguez",
          gender: "male",
        },
        {
          membershipId: "m-riley",
          swimmerId: "s-riley",
          firstName: "Riley",
          lastName: "Cain",
          gender: "female",
        },
        {
          membershipId: "m-orion",
          swimmerId: "s-orion",
          firstName: "Orion",
          lastName: "Chaturvedi",
          gender: "male",
          classYear: "SR",
        },
        {
          membershipId: "m-dante",
          swimmerId: "s-dante",
          firstName: "Dante",
          lastName: "Flores",
          gender: "male",
        },
        {
          membershipId: "m-ruben",
          swimmerId: "s-ruben",
          firstName: "Ruben",
          lastName: "Anguiano",
          gender: "male",
        },
      ],
    });

    const report = buildSplitSheetReport(snapshot);
    expect(report.reportTitle).toBe("Split sheet");
    expect(report.pageOrientation).toBe("portrait");
    expect(report.groupBy).toBe("event");
    expect(report.teamCode).toBe("MARI-AZ");
    expect(report.location).toBe("Chandler High School");

    const relay = report.events[0];
    expect(relay?.kind).toBe("relay");
    if (relay?.kind === "relay") {
      expect(relay.teams).toHaveLength(2);
      expect(relay.teams[0]?.marks.map((m) => m.label)).toEqual([
        "50 (Back)",
        "100 (Breast)",
        "150 (Fly)",
        "200 (Free)",
        "Overall",
      ]);
      expect(relay.teams[0]?.marks[0]?.athleteName).toBe(
        "Orion Chaturvedi (SR)",
      );
      expect(relay.teams[0]?.marks.some((m) => m.label.startsWith("Alt"))).toBe(
        false,
      );
    }

    const free = report.events[1];
    expect(free?.kind).toBe("individual");
    if (free?.kind === "individual") {
      expect(free.rows).toHaveLength(2);
      expect(free.rows[0]?.marks.map((m) => m.label)).toEqual([
        "25",
        "50",
        "Overall",
      ]);
      expect(free.rows[0]?.marks.at(-1)?.isFinal).toBe(true);
      expect(free.rows[0]?.marks[1]?.isFinal).toBe(false);
      expect(free.rows[0]?.name).toBe("Juan Trejo (SR)");
      expect(free.rows[1]?.seedLabel).toBe("NT");
    }

    const withAlts = buildSplitSheetReport(snapshot, {
      includeRelayAlternates: true,
    });
    const relayAlts = withAlts.events[0];
    if (relayAlts?.kind === "relay") {
      expect(relayAlts.teams[0]?.marks.map((m) => m.label)).toEqual([
        "50 (Back)",
        "100 (Breast)",
        "150 (Fly)",
        "200 (Free)",
        "Alt 5",
        "Overall",
      ]);
      expect(relayAlts.teams[0]?.marks[4]?.athleteName).toContain("Ruben");
    }
  });

  it("uses landscape for 500 free and leftover 50 on 1650", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: { name: "Invite", startDate: "2026-09-12", course: "SCY" },
      team: { name: "Maricopa" },
      events: [
        {
          id: "e21",
          eventNumber: 21,
          stroke: "free",
          distance: 500,
          gender: "female",
          eventKey: "500_free_scy_f",
        },
        {
          id: "e23",
          eventNumber: 23,
          stroke: "free",
          distance: 1650,
          gender: "male",
          eventKey: "1650_free_scy_m",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e21",
          membershipId: "m1",
          seedTimeMs: 320_000,
          exhibition: false,
          status: "entered",
        },
        {
          id: "a2",
          meetEventId: "e23",
          membershipId: "m2",
          seedTimeMs: 1_100_000,
          exhibition: false,
          status: "entered",
        },
      ],
      relayLegs: [],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Riley",
          lastName: "Cain",
          gender: "female",
        },
        {
          membershipId: "m2",
          swimmerId: "s2",
          firstName: "Juan",
          lastName: "Trejo",
          gender: "male",
        },
      ],
    });

    const report = buildSplitSheetReport(snapshot);
    expect(report.pageOrientation).toBe("landscape");
    const five = report.events[0];
    if (five?.kind === "individual") {
      expect(five.rows[0]?.marks).toHaveLength(11);
      expect(five.rows[0]?.marks.map((m) => m.label).at(-1)).toBe("Overall");
      expect(five.rows[0]?.marks.map((m) => m.label).at(-2)).toBe("500");
    }
    const mile = report.events[1];
    if (mile?.kind === "individual") {
      expect(mile.rows[0]?.marks).toHaveLength(18);
      expect(mile.rows[0]?.marks.at(-1)?.label).toBe("Overall");
      expect(mile.rows[0]?.marks.at(-2)?.label).toBe("1650");
      expect(mile.rows[0]?.marks.at(-3)?.label).toBe("1600");
    }
  });

  it("labels IM 50s with stroke order", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: { name: "Invite", startDate: "2026-09-12", course: "SCY" },
      team: { name: "Maricopa" },
      events: [
        {
          id: "e11",
          eventNumber: 11,
          stroke: "im",
          distance: 200,
          gender: "male",
          eventKey: "200_im_scy_m",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e11",
          membershipId: "m1",
          seedTimeMs: 130_000,
          exhibition: false,
          status: "entered",
        },
      ],
      relayLegs: [],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Juan",
          lastName: "Trejo",
          gender: "male",
        },
      ],
    });
    const report = buildSplitSheetReport(snapshot);
    const im = report.events[0];
    expect(im?.kind).toBe("individual");
    if (im?.kind === "individual") {
      expect(im.rows[0]?.marks.map((m) => m.label)).toEqual([
        "50 (Fly)",
        "100 (Back)",
        "150 (Breast)",
        "200 (Free)",
        "Overall",
      ]);
    }
  });

  it("groups by swimmer with one relay box per assigned leg", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "Dual",
        startDate: "2026-09-12",
        course: "SCY",
        opponents: "Desert Ridge",
      },
      team: { name: "Maricopa", teamCode: "MARI" },
      events: [
        {
          id: "e1",
          eventNumber: 1,
          stroke: "free_relay",
          distance: 200,
          gender: "male",
          eventKey: "200_free_relay_scy_m",
        },
        {
          id: "e7",
          eventNumber: 7,
          stroke: "free",
          distance: 50,
          gender: "male",
          eventKey: "50_free_scy_m",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e7",
          membershipId: "m-orion",
          seedTimeMs: 22_000,
          exhibition: true,
          status: "entered",
        },
      ],
      relayLegs: [
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m-orion",
        },
      ],
      relayTeams: [{ meetEventId: "e1", relayLetter: "A", seedTimeMs: null }],
      members: [
        {
          membershipId: "m-orion",
          swimmerId: "s-orion",
          firstName: "Orion",
          lastName: "Chaturvedi",
          gender: "male",
        },
      ],
    });

    const report = buildSplitSheetReport(snapshot, { groupBy: "swimmer" });
    expect(report.groupBy).toBe("swimmer");
    expect(report.opponents).toBe("Desert Ridge");
    expect(report.swimmers).toHaveLength(1);
    const lines = report.swimmers[0]?.lines ?? [];
    expect(
      lines.some((line) => line.kind === "relay" && line.marks.length === 2),
    ).toBe(true);
    const individual = lines.find((line) => line.kind === "individual");
    expect(individual?.exhibition).toBe(true);
    expect(individual?.marks).toHaveLength(3);
  });

  it("applies coach overrides, LCM 50 has one box, and skips empty relays", () => {
    const snapshot = buildMeetLineupSnapshot({
      meet: {
        name: "Invite",
        startDate: "2026-09-12",
        course: "LCM",
      },
      team: {
        addressLine1: "1 Main",
        city: "Maricopa",
        region: "AZ",
        postalCode: "85138",
        contactName: "Head Coach",
        contactEmail: "c@x.com",
      },
      events: [
        {
          id: "e1",
          eventNumber: 1,
          stroke: "free",
          distance: 50,
          gender: "female",
          eventKey: "50_free_lcm_f",
        },
        {
          id: "e2",
          eventNumber: 2,
          stroke: "free_relay",
          distance: 200,
          gender: "female",
          eventKey: "200_free_relay_lcm_f",
        },
      ],
      entries: [
        {
          id: "a1",
          meetEventId: "e1",
          membershipId: "m1",
          seedTimeMs: 28_000,
          exhibition: false,
          status: "entered",
        },
        {
          id: "a2",
          meetEventId: "e1",
          membershipId: "m2",
          seedTimeMs: 28_000,
          exhibition: false,
          status: "entered",
        },
      ],
      relayLegs: [],
      members: [
        {
          membershipId: "m1",
          swimmerId: "s1",
          firstName: "Alex",
          lastName: "Smith",
          gender: "female",
        },
        {
          membershipId: "m2",
          swimmerId: "s2",
          firstName: "Bea",
          lastName: "Adams",
          gender: "female",
        },
      ],
    });

    const fromTeam = buildSplitSheetReport(snapshot);
    expect(fromTeam.teamName).toBe("Team");
    expect(fromTeam.teamCode).toBeNull();
    expect(fromTeam.coachName).toBe("Head Coach");
    expect(fromTeam.coachEmail).toBe("c@x.com");
    expect(fromTeam.teamAddress).toContain("1 Main");

    const report = buildSplitSheetReport(snapshot, {
      coachName: "Session Coach",
      coachEmail: "s@x.com",
      teamAddress: "Override",
    });
    expect(report.coachName).toBe("Session Coach");
    expect(report.teamAddress).toBe("Override");
    expect(report.events).toHaveLength(1);
    if (report.events[0]?.kind === "individual") {
      expect(report.events[0].rows[0]?.marks.map((m) => m.label)).toEqual([
        "50",
        "Overall",
      ]);
      expect(report.events[0].rows.map((r) => r.name)).toEqual([
        "Bea Adams",
        "Alex Smith",
      ]);
    }
  });
});
