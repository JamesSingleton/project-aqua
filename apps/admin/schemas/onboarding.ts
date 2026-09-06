import { TEAM_TYPES, type TeamType } from "@project-aqua/swim-core/team-types";
import { z } from "zod";

const teamTypeValues = TEAM_TYPES.map((t) => t.value) as [
  TeamType,
  ...TeamType[],
];

const optionalCapSchema = z.string().refine(
  (value) => {
    const raw = value.trim();
    if (raw === "") return true;
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n >= 1;
  },
  { message: "Enter 1 or more, or leave blank for unlimited" },
);

export const onboardingFormSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(2, "Enter a team name")
    .max(100, "Team name is too long"),
  teamType: z.enum(teamTypeValues, {
    message: "Select a team type",
  }),
  maxScoringEntriesPerIndividualEvent: optionalCapSchema,
  maxRelayTeamsPerEvent: optionalCapSchema,
  coachName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(100, "Name is too long"),
  coachTitle: z.string().trim().max(80, "Title is too long"),
  plan: z.enum(["free", "pro", "enterprise"]),
});

export type OnboardingFormValues = z.infer<typeof onboardingFormSchema>;

export const TEAM_STEP_FIELDS = [
  "teamName",
  "teamType",
  "maxScoringEntriesPerIndividualEvent",
  "maxRelayTeamsPerEvent",
] as const;
export const COACH_STEP_FIELDS = ["coachName", "coachTitle"] as const;
export const BILLING_STEP_FIELDS = ["plan"] as const;
