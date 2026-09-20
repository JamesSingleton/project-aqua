import { describe, expect, it } from "vitest";
import { onboardingFormSchema } from "../../schemas/onboarding";

describe("onboardingFormSchema", () => {
  const valid = {
    teamName: "Aqua Club",
    teamType: "club" as const,
    coachFirstName: "Jamie",
    coachLastName: "Coach",
    coachTitle: "Head Coach",
    plan: "pro" as const,
  };

  it("accepts summer league teams", () => {
    expect(
      onboardingFormSchema.parse({ ...valid, teamType: "summer" }).teamType,
    ).toBe("summer");
  });

  it("rejects short team names and invalid plan/type", () => {
    expect(() =>
      onboardingFormSchema.parse({ ...valid, teamName: "A" }),
    ).toThrow();
    expect(() =>
      onboardingFormSchema.parse({ ...valid, plan: "gold" }),
    ).toThrow();
    expect(() =>
      onboardingFormSchema.parse({ ...valid, teamType: "rec" }),
    ).toThrow();
  });

  it("trims and enforces max lengths", () => {
    expect(
      onboardingFormSchema.parse({
        ...valid,
        teamName: "  Aqua  ",
        coachFirstName: "  Jamie  ",
        coachTitle: "",
      }),
    ).toMatchObject({ teamName: "Aqua", coachFirstName: "Jamie" });
    expect(
      onboardingFormSchema.parse({
        ...valid,
        teamType: "high_school",
      }).teamType,
    ).toBe("high_school");
  });
});
