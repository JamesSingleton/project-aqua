import { describe, expect, it } from "vitest";
import {
  buildMeetEntriesReport,
  formatCourseLabel,
  formatMeetDateCompact,
  formatReportEventTitle,
  formatSeedLabel,
} from "../src/meet-entries/build";

describe("meet entries report formatting", () => {
  it("formats TM-style dates and course labels", () => {
    expect(formatMeetDateCompact("2026-09-12")).toBe("12-Sep-26");
    expect(formatCourseLabel("SCY")).toBe("Yards");
    expect(formatCourseLabel("LCM")).toBe("Long Course Meters");
  });

  it("formats seeds with course suffix", () => {
    expect(formatSeedLabel(56_240, "SCY")).toBe("56.24Y");
    expect(formatSeedLabel(null, "SCY")).toBe("NT");
    expect(formatSeedLabel(127_540, "SCY", true)).toBe("2:07.54Y ex");
  });

  it("uses short stroke titles", () => {
    expect(formatReportEventTitle(200, "free")).toBe("200 Free");
    expect(formatReportEventTitle(200, "medley_relay")).toBe(
      "200 Medley Relay",
    );
  });
});

describe("buildMeetEntriesReport", () => {
  it("groups by event and omits relay alternates", () => {
    const report = buildMeetEntriesReport({
      meetName: "2026 Croswhite Invite",
      startDate: "2026-09-12",
      course: "SCY",
      location: "Chandler High School",
      teamName: "Maricopa High School",
      teamCode: "MARI-AZ",
      coachName: "Meg O'Brien",
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
          firstName: "Juan",
          lastName: "Trejo",
          seedTimeMs: 35_160,
          exhibition: false,
          status: "entered",
          stroke: "free",
          eventKey: "50_free_scy_m",
          gender: "male",
        },
        {
          id: "a2",
          meetEventId: "e7",
          membershipId: "m-antonio",
          firstName: "Antonio",
          lastName: "Rodriguez",
          seedTimeMs: null,
          exhibition: false,
          status: "entered",
          stroke: "free",
          eventKey: "50_free_scy_m",
          gender: "male",
        },
        {
          id: "a3",
          meetEventId: "e8",
          membershipId: "m-riley",
          firstName: "Riley",
          lastName: "Cain",
          seedTimeMs: null,
          exhibition: false,
          status: "scratched",
          stroke: "free",
          eventKey: "50_free_scy_f",
          gender: "female",
        },
      ],
      relayLegs: [
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 1,
          membershipId: "m-orion",
          firstName: "Orion",
          lastName: "Chaturvedi",
        },
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 2,
          membershipId: "m-dante",
          firstName: "Dante",
          lastName: "Flores",
        },
        {
          meetEventId: "e1",
          relayLetter: "A",
          legOrder: 5,
          membershipId: "m-ruben",
          firstName: "Ruben",
          lastName: "Anguiano",
        },
      ],
      relayTeamSeeds: [
        { meetEventId: "e1", relayLetter: "A", seedTimeMs: 112_540 },
      ],
      athletesByMembershipId: new Map([
        [
          "m-juan",
          {
            membershipId: "m-juan",
            firstName: "Juan",
            lastName: "Trejo",
            classYear: "SR",
          },
        ],
        [
          "m-orion",
          {
            membershipId: "m-orion",
            firstName: "Orion",
            lastName: "Chaturvedi",
            classYear: "SR",
          },
        ],
      ]),
    });

    expect(report.reportTitle).toBe("Individual Meet Entries Report");
    expect(report.meetDateLabel).toBe("12-Sep-26");
    expect(report.events).toHaveLength(2);

    const relay = report.events[0];
    expect(relay?.kind).toBe("relay");
    if (relay?.kind === "relay") {
      expect(relay.teams[0]?.seedLabel).toBe("1:52.54Y");
      expect(relay.teams[0]?.legs).toHaveLength(2);
      expect(relay.teams[0]?.legs.map((l) => l.legOrder)).toEqual([1, 2]);
      expect(relay.teams[0]?.legs[0]?.name).toBe("Orion Chaturvedi (SR)");
    }

    const free = report.events[1];
    expect(free?.kind).toBe("individual");
    if (free?.kind === "individual") {
      expect(free.athletes).toHaveLength(2);
      expect(free.athletes[0]?.seedLabel).toBe("35.16Y");
      expect(free.athletes[1]?.seedLabel).toBe("NT");
      expect(free.athletes[0]?.name).toBe("Juan Trejo (SR)");
    }

    expect(report.summary).toEqual({
      femaleIndividualEntries: 0,
      maleIndividualEntries: 2,
      totalIndividualEntries: 2,
      totalRelayEntries: 1,
      totalAthletes: 4,
    });
  });
});
