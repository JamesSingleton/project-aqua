import {
  buildEventKey,
  COURSES,
  type Course,
  EVENT_GENDERS,
  type EventGender,
  formatEventLabel,
  formatEventName,
  STROKES,
  type Stroke,
} from "./events";

export type EventType = "individual" | "relay";

export interface CatalogEvent {
  eventKey: string;
  label: string;
  distance: number;
  stroke: Stroke | "free_relay" | "medley_relay";
  course: Course;
  gender: EventGender;
  eventType: EventType;
  relayLegs?: number;
}

const INDIVIDUAL_DISTANCES: Record<Stroke, number[]> = {
  free: [50, 100, 200, 400, 500, 800, 1000, 1500, 1650],
  back: [50, 100, 200],
  breast: [50, 100, 200],
  fly: [50, 100, 200],
  im: [100, 200, 400],
};

const COURSE_DISTANCE_OVERRIDES: Partial<
  Record<Course, Partial<Record<Stroke, number[]>>>
> = {
  SCY: {
    free: [50, 100, 200, 500, 1000, 1650],
    im: [100, 200, 400],
  },
  SCM: {
    free: [50, 100, 200, 400, 800, 1500],
    im: [100, 200, 400],
  },
  LCM: {
    free: [50, 100, 200, 400, 800, 1500],
    im: [200, 400],
  },
};

function distancesFor(stroke: Stroke, course: Course): number[] {
  return (
    COURSE_DISTANCE_OVERRIDES[course]?.[stroke] ?? INDIVIDUAL_DISTANCES[stroke]
  );
}

function buildIndividualEvents(): CatalogEvent[] {
  const events: CatalogEvent[] = [];

  for (const course of COURSES) {
    for (const stroke of STROKES) {
      for (const distance of distancesFor(stroke, course)) {
        for (const gender of EVENT_GENDERS.filter((g) => g !== "mixed")) {
          const eventKey = buildEventKey(distance, stroke, course, gender);
          events.push({
            eventKey,
            label: formatEventLabel(distance, stroke),
            distance,
            stroke,
            course,
            gender,
            eventType: "individual",
          });
        }
      }
    }
  }

  return events;
}

function buildRelayEvents(): CatalogEvent[] {
  const events: CatalogEvent[] = [];
  const relayConfigs: Array<{
    distance: number;
    stroke: "free_relay" | "medley_relay";
    courses: Course[];
  }> = [
    { distance: 200, stroke: "free_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 400, stroke: "free_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 800, stroke: "free_relay", courses: ["SCM", "LCM"] },
    { distance: 200, stroke: "medley_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 400, stroke: "medley_relay", courses: ["SCY", "SCM", "LCM"] },
  ];

  for (const { distance, stroke, courses } of relayConfigs) {
    for (const course of courses) {
      for (const gender of EVENT_GENDERS) {
        const eventKey = buildEventKey(distance, stroke, course, gender);
        events.push({
          eventKey,
          label: formatEventName(distance, stroke),
          distance,
          stroke,
          course,
          gender,
          eventType: "relay",
          relayLegs: 4,
        });
      }
    }
  }

  return events;
}

export const EVENT_CATALOG: CatalogEvent[] = [
  ...buildIndividualEvents(),
  ...buildRelayEvents(),
];

export function getCatalogEvent(eventKey: string): CatalogEvent | undefined {
  return EVENT_CATALOG.find((e) => e.eventKey === eventKey);
}
