import type { EventGender } from "./events";

export type MeetEventPresetRow = {
  eventNumber: number;
  distance: number;
  stroke: string;
  gender: EventGender;
  ageGroup?: string;
};

export type BuiltInMeetEventPreset = {
  id: string;
  label: string;
  course: "SCY" | "SCM" | "LCM";
  events: MeetEventPresetRow[];
};

/** Standard high-school style SCY dual meet (22 events). */
export const SCY_DUAL_MEET_PRESET: BuiltInMeetEventPreset = {
  id: "scy_dual",
  label: "SCY dual meet",
  course: "SCY",
  events: [
    { eventNumber: 1, distance: 200, stroke: "medley_relay", gender: "female" },
    { eventNumber: 2, distance: 200, stroke: "medley_relay", gender: "male" },
    { eventNumber: 3, distance: 200, stroke: "free", gender: "female" },
    { eventNumber: 4, distance: 200, stroke: "free", gender: "male" },
    { eventNumber: 5, distance: 200, stroke: "im", gender: "female" },
    { eventNumber: 6, distance: 200, stroke: "im", gender: "male" },
    { eventNumber: 7, distance: 50, stroke: "free", gender: "female" },
    { eventNumber: 8, distance: 50, stroke: "free", gender: "male" },
    { eventNumber: 9, distance: 100, stroke: "fly", gender: "female" },
    { eventNumber: 10, distance: 100, stroke: "fly", gender: "male" },
    { eventNumber: 11, distance: 100, stroke: "free", gender: "female" },
    { eventNumber: 12, distance: 100, stroke: "free", gender: "male" },
    { eventNumber: 13, distance: 500, stroke: "free", gender: "female" },
    { eventNumber: 14, distance: 500, stroke: "free", gender: "male" },
    { eventNumber: 15, distance: 200, stroke: "free_relay", gender: "female" },
    { eventNumber: 16, distance: 200, stroke: "free_relay", gender: "male" },
    { eventNumber: 17, distance: 100, stroke: "back", gender: "female" },
    { eventNumber: 18, distance: 100, stroke: "back", gender: "male" },
    { eventNumber: 19, distance: 100, stroke: "breast", gender: "female" },
    { eventNumber: 20, distance: 100, stroke: "breast", gender: "male" },
    { eventNumber: 21, distance: 400, stroke: "free_relay", gender: "female" },
    { eventNumber: 22, distance: 400, stroke: "free_relay", gender: "male" },
  ],
};

/** Common SCY age-group sampler (individual + relay). */
export const SCY_AGE_GROUP_PRESET: BuiltInMeetEventPreset = {
  id: "scy_age_group",
  label: "SCY age-group sampler",
  course: "SCY",
  events: [
    {
      eventNumber: 1,
      distance: 100,
      stroke: "free",
      gender: "female",
      ageGroup: "10&U",
    },
    {
      eventNumber: 2,
      distance: 100,
      stroke: "free",
      gender: "male",
      ageGroup: "10&U",
    },
    {
      eventNumber: 3,
      distance: 50,
      stroke: "free",
      gender: "female",
      ageGroup: "11-12",
    },
    {
      eventNumber: 4,
      distance: 50,
      stroke: "free",
      gender: "male",
      ageGroup: "11-12",
    },
    {
      eventNumber: 5,
      distance: 100,
      stroke: "im",
      gender: "female",
      ageGroup: "11-12",
    },
    {
      eventNumber: 6,
      distance: 100,
      stroke: "im",
      gender: "male",
      ageGroup: "11-12",
    },
    {
      eventNumber: 7,
      distance: 100,
      stroke: "back",
      gender: "female",
      ageGroup: "13-14",
    },
    {
      eventNumber: 8,
      distance: 100,
      stroke: "back",
      gender: "male",
      ageGroup: "13-14",
    },
    {
      eventNumber: 9,
      distance: 100,
      stroke: "breast",
      gender: "female",
      ageGroup: "13-14",
    },
    {
      eventNumber: 10,
      distance: 100,
      stroke: "breast",
      gender: "male",
      ageGroup: "13-14",
    },
    {
      eventNumber: 11,
      distance: 100,
      stroke: "fly",
      gender: "female",
      ageGroup: "13-14",
    },
    {
      eventNumber: 12,
      distance: 100,
      stroke: "fly",
      gender: "male",
      ageGroup: "13-14",
    },
    {
      eventNumber: 13,
      distance: 200,
      stroke: "free",
      gender: "female",
      ageGroup: "13-14",
    },
    {
      eventNumber: 14,
      distance: 200,
      stroke: "free",
      gender: "male",
      ageGroup: "13-14",
    },
    {
      eventNumber: 15,
      distance: 200,
      stroke: "medley_relay",
      gender: "female",
      ageGroup: "Mixed",
    },
    {
      eventNumber: 16,
      distance: 200,
      stroke: "medley_relay",
      gender: "male",
      ageGroup: "Mixed",
    },
    {
      eventNumber: 17,
      distance: 200,
      stroke: "free_relay",
      gender: "female",
      ageGroup: "Mixed",
    },
    {
      eventNumber: 18,
      distance: 200,
      stroke: "free_relay",
      gender: "male",
      ageGroup: "Mixed",
    },
  ],
};

export const BUILT_IN_MEET_EVENT_PRESETS: BuiltInMeetEventPreset[] = [
  SCY_DUAL_MEET_PRESET,
  SCY_AGE_GROUP_PRESET,
];

export function getBuiltInMeetEventPreset(
  id: string,
): BuiltInMeetEventPreset | undefined {
  return BUILT_IN_MEET_EVENT_PRESETS.find((preset) => preset.id === id);
}

export function suggestNextEventNumber(existingNumbers: number[]): number {
  if (existingNumbers.length === 0) return 1;
  return Math.max(...existingNumbers) + 1;
}
