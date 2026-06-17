export const COURSES = ["SCY", "SCM", "LCM"] as const;
export type Course = (typeof COURSES)[number];

export const STROKES = ["free", "back", "breast", "fly", "im"] as const;
export type Stroke = (typeof STROKES)[number];

export const GENDERS = ["male", "female"] as const;
export type Gender = (typeof GENDERS)[number];

export type EventKey = `${number}_${Stroke}_${Lowercase<Course>}_${"m" | "f"}`;

export interface SwimEvent {
  key: EventKey;
  distance: number;
  stroke: Stroke;
  course: Course;
  gender: "m" | "f";
  label: string;
}

const STROKE_LABELS: Record<Stroke, string> = {
  free: "Freestyle",
  back: "Backstroke",
  breast: "Breaststroke",
  fly: "Butterfly",
  im: "Individual Medley",
};

export function buildEventKey(
  distance: number,
  stroke: Stroke,
  course: Course,
  gender: "m" | "f",
): EventKey {
  return `${distance}_${stroke}_${course.toLowerCase() as Lowercase<Course>}_${gender}`;
}

export function formatEventLabel(
  distance: number,
  stroke: Stroke,
  course: Course,
): string {
  return `${distance} ${STROKE_LABELS[stroke]} ${course}`;
}

export const COMMON_EVENTS: SwimEvent[] = [
  {
    distance: 50,
    stroke: "free",
    course: "SCY",
    gender: "m",
    key: "50_free_scy_m",
    label: "50 Freestyle SCY",
  },
  {
    distance: 50,
    stroke: "free",
    course: "SCY",
    gender: "f",
    key: "50_free_scy_f",
    label: "50 Freestyle SCY",
  },
  {
    distance: 100,
    stroke: "free",
    course: "SCY",
    gender: "m",
    key: "100_free_scy_m",
    label: "100 Freestyle SCY",
  },
  {
    distance: 100,
    stroke: "free",
    course: "SCY",
    gender: "f",
    key: "100_free_scy_f",
    label: "100 Freestyle SCY",
  },
  {
    distance: 200,
    stroke: "free",
    course: "SCY",
    gender: "m",
    key: "200_free_scy_m",
    label: "200 Freestyle SCY",
  },
  {
    distance: 200,
    stroke: "free",
    course: "SCY",
    gender: "f",
    key: "200_free_scy_f",
    label: "200 Freestyle SCY",
  },
  {
    distance: 100,
    stroke: "fly",
    course: "SCY",
    gender: "m",
    key: "100_fly_scy_m",
    label: "100 Butterfly SCY",
  },
  {
    distance: 100,
    stroke: "fly",
    course: "SCY",
    gender: "f",
    key: "100_fly_scy_f",
    label: "100 Butterfly SCY",
  },
  {
    distance: 100,
    stroke: "back",
    course: "SCY",
    gender: "m",
    key: "100_back_scy_m",
    label: "100 Backstroke SCY",
  },
  {
    distance: 100,
    stroke: "back",
    course: "SCY",
    gender: "f",
    key: "100_back_scy_f",
    label: "100 Backstroke SCY",
  },
  {
    distance: 100,
    stroke: "breast",
    course: "SCY",
    gender: "m",
    key: "100_breast_scy_m",
    label: "100 Breaststroke SCY",
  },
  {
    distance: 100,
    stroke: "breast",
    course: "SCY",
    gender: "f",
    key: "100_breast_scy_f",
    label: "100 Breaststroke SCY",
  },
  {
    distance: 200,
    stroke: "im",
    course: "SCY",
    gender: "m",
    key: "200_im_scy_m",
    label: "200 IM SCY",
  },
  {
    distance: 200,
    stroke: "im",
    course: "SCY",
    gender: "f",
    key: "200_im_scy_f",
    label: "200 IM SCY",
  },
];
