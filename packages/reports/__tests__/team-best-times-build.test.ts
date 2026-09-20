import { describe, expect, it } from "vitest";
import {
  buildTeamBestTimesReport,
  formatTeamBestTimesCsv,
} from "../src/team-best-times/build";

describe("buildTeamBestTimesReport", () => {
  const times = [
    {
      swimmerId: "f1",
      swimmerName: "Ada Lovelace",
      gender: "female" as const,
      eventKey: "50_free_scy_f",
      course: "SCY" as const,
      timeMs: 26_500,
    },
    {
      swimmerId: "f1",
      swimmerName: "Ada Lovelace",
      gender: "female" as const,
      eventKey: "100_free_scy_f",
      course: "SCY" as const,
      timeMs: 58_200,
    },
    {
      swimmerId: "f2",
      swimmerName: "Grace Hopper",
      gender: "female" as const,
      eventKey: "50_free_scy_f",
      course: "SCY" as const,
      timeMs: 27_100,
    },
    {
      swimmerId: "f3",
      swimmerName: "Katherine Johnson",
      gender: "female" as const,
      eventKey: "50_free_scy_f",
      course: "SCY" as const,
      timeMs: 27_400,
    },
    {
      swimmerId: "f4",
      swimmerName: "Dorothy Vaughan",
      gender: "female" as const,
      eventKey: "50_free_scy_f",
      course: "SCY" as const,
      timeMs: 27_800,
    },
    {
      swimmerId: "f5",
      swimmerName: "Mary Jackson",
      gender: "female" as const,
      eventKey: "50_free_scy_f",
      course: "SCY" as const,
      timeMs: 28_000,
    },
    {
      swimmerId: "f1",
      swimmerName: "Ada Lovelace",
      gender: "female" as const,
      eventKey: "50_back_scy_f",
      course: "SCY" as const,
      timeMs: 29_000,
    },
    {
      swimmerId: "f2",
      swimmerName: "Grace Hopper",
      gender: "female" as const,
      eventKey: "50_breast_scy_f",
      course: "SCY" as const,
      timeMs: 34_000,
    },
    {
      swimmerId: "f3",
      swimmerName: "Katherine Johnson",
      gender: "female" as const,
      eventKey: "50_fly_scy_f",
      course: "SCY" as const,
      timeMs: 28_500,
    },
    {
      swimmerId: "m1",
      swimmerName: "Alan Turing",
      gender: "male" as const,
      eventKey: "50_free_scy_m",
      course: "SCY" as const,
      timeMs: 22_500,
    },
    {
      swimmerId: "m1",
      swimmerName: "Alan Turing",
      gender: "male" as const,
      eventKey: "50_free_lcm_m",
      course: "LCM" as const,
      timeMs: 25_000,
    },
  ];

  it("builds female then male SCY matrices with only events that have times", () => {
    const report = buildTeamBestTimesReport({
      teamName: "Aqua High",
      teamCode: "AQUA",
      times,
      generatedAt: new Date("2026-09-20T12:00:00Z"),
    });

    expect(report.course).toBe("SCY");
    expect(report.sections.map((s) => s.gender)).toEqual(["female", "male"]);
    expect(report.sections[0]!.columns.map((c) => c.label)).toEqual([
      "50 Free",
      "50 Back",
      "50 Breast",
      "50 Fly",
      "100 Free",
    ]);
    expect(report.sections[0]!.rows).toHaveLength(5);
    expect(report.sections[1]!.columns.map((c) => c.label)).toEqual([
      "50 Free",
    ]);
    expect(report.sections[1]!.rows).toHaveLength(1);
  });

  it("suggests free and medley relays only when A can be filled", () => {
    const report = buildTeamBestTimesReport({
      teamName: "Aqua High",
      times,
    });

    const free200 = report.relaySuggestions.filter(
      (r) => r.title === "200 Free Relay" && r.gender === "female",
    );
    expect(free200.length).toBeGreaterThanOrEqual(1);
    expect(free200[0]!.legs).toHaveLength(4);
    expect(free200[0]!.letter).toBe("A");

    const medley = report.relaySuggestions.filter(
      (r) => r.title === "200 Medley Relay" && r.gender === "female",
    );
    expect(medley).toHaveLength(1);
    expect(medley[0]!.legs.map((l) => l.roleLabel)).toEqual([
      "Back",
      "Breast",
      "Fly",
      "Free",
    ]);

    // Male only has one 50 free — cannot form free relay A
    expect(
      report.relaySuggestions.filter(
        (r) => r.gender === "male" && r.title.includes("Free Relay"),
      ),
    ).toHaveLength(0);
  });

  it("formats CSV with matrix then relay suggestions", () => {
    const report = buildTeamBestTimesReport({
      teamName: "Aqua High",
      times,
      generatedAt: new Date("2026-09-20T12:00:00Z"),
    });
    const csv = formatTeamBestTimesCsv(report);
    expect(csv).toContain("Female");
    expect(csv).toContain("Male");
    expect(csv).toContain("Ada Lovelace");
    expect(csv).toContain("Relay suggestions");
    expect(csv).toContain("200 Free Relay");
  });
});
