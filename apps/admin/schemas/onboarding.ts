import { TEAM_TYPES, type TeamType } from "@project-aqua/swim-core/team-types";
import { z } from "zod";
import { firstNameSchema, lastNameSchema } from "./account-profile";

const teamTypeValues = TEAM_TYPES.map((t) => t.value) as [
  TeamType,
  ...TeamType[],
];

export const onboardingFormSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(2, "Enter a team name")
    .max(100, "Team name is too long"),
  teamType: z.enum(teamTypeValues, {
    message: "Select a team type",
  }),
  coachFirstName: firstNameSchema,
  coachLastName: lastNameSchema,
  coachTitle: z.string().trim().max(80, "Title is too long"),
  plan: z.enum(["free", "pro", "enterprise"]),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const TEAM_STEP_FIELDS = ["teamName", "teamType"] as const;
export const COACH_STEP_FIELDS = [
  "coachFirstName",
  "coachLastName",
  "coachTitle",
] as const;
export const BILLING_STEP_FIELDS = ["plan"] as const;
