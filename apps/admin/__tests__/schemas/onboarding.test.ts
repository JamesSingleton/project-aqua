import { describe, expect, it } from "vitest";
import { onboardingFormSchema } from "../../schemas/onboarding";

describe("onboardingFormSchema", () => {
  const valid = {
    teamName: "Aqua Club",
    teamType: "club" as const,
    coachName: "Jamie Coach",
    coachTitle: "Head Coach",
    plan: "pro" as const,
  };

  it("accepts valid values", () => {
    expect(onboardingFormSchema.parse(valid)).toEqual(valid);
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
        coachTitle: "",
      }).teamName,
    ).toBe("Aqua");
    expect(() =>
      onboardingFormSchema.parse({
        ...valid,
        teamName: "x".repeat(101),
      }),
    ).toThrow();
  });
});
