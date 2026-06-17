import { writeFileSync } from "node:fs";

const COURSES = ["SCY", "SCM", "LCM"];
const STROKES = ["free", "back", "breast", "fly", "im"];
const STROKE_LABELS = {
  free: "Freestyle",
  back: "Backstroke",
  breast: "Breaststroke",
  fly: "Butterfly",
  im: "Individual Medley",
};

const COURSE_DISTANCE_OVERRIDES = {
  SCY: { free: [50, 100, 200, 500, 1000, 1650], im: [100, 200, 400] },
  SCM: { free: [50, 100, 200, 400, 800, 1500], im: [100, 200, 400] },
  LCM: { free: [50, 100, 200, 400, 800, 1500], im: [200, 400] },
};

const DEFAULT_DISTANCES = {
  free: [50, 100, 200, 400, 500, 800, 1000, 1500, 1650],
  back: [50, 100, 200],
  breast: [50, 100, 200],
  fly: [50, 100, 200],
  im: [100, 200, 400],
};

function distancesFor(stroke, course) {
  return COURSE_DISTANCE_OVERRIDES[course]?.[stroke] ?? DEFAULT_DISTANCES[stroke];
}

function buildCatalog() {
  const events = [];

  for (const course of COURSES) {
    for (const stroke of STROKES) {
      for (const distance of distancesFor(stroke, course)) {
        for (const gender of ["m", "f"]) {
          const eventKey = `${distance}_${stroke}_${course.toLowerCase()}_${gender}`;
          events.push({
            eventKey,
            label: `${distance} ${STROKE_LABELS[stroke]} ${course}`,
            distance,
            stroke,
            course,
            gender,
            eventType: "individual",
            relayLegs: null,
          });
        }
      }
    }
  }

  const relayConfigs = [
    { distance: 200, stroke: "free_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 400, stroke: "free_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 800, stroke: "free_relay", courses: ["SCM", "LCM"] },
    { distance: 200, stroke: "medley_relay", courses: ["SCY", "SCM", "LCM"] },
    { distance: 400, stroke: "medley_relay", courses: ["SCY", "SCM", "LCM"] },
  ];

  for (const { distance, stroke, courses } of relayConfigs) {
    const strokeLabel =
      stroke === "free_relay" ? "Freestyle Relay" : "Medley Relay";
    for (const course of courses) {
      for (const gender of ["m", "f"]) {
        const eventKey = `${distance}_${stroke}_${course.toLowerCase()}_${gender}`;
        events.push({
          eventKey,
          label: `${distance} ${strokeLabel} ${course}`,
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

const EVENT_CATALOG = buildCatalog();
const esc = (s) => s.replace(/'/g, "''");

const values = EVENT_CATALOG.map((e) => {
  const relayLegs = e.relayLegs ?? null;
  return `('${esc(e.eventKey)}', '${esc(e.label)}', ${e.distance}, '${esc(e.stroke)}', '${e.course}', '${e.gender}', '${e.eventType}', ${relayLegs === null ? "NULL" : relayLegs})`;
});

const sql = `-- Auto-generated swim_events seed (${EVENT_CATALOG.length} events)
INSERT INTO "swim_events" ("event_key", "label", "distance", "stroke", "course", "gender", "event_type", "relay_legs")
VALUES
${values.join(",\n")}
ON CONFLICT ("event_key") DO NOTHING;
`;

writeFileSync(new URL("./swim-events-seed.sql", import.meta.url), sql);
console.log(`Wrote ${EVENT_CATALOG.length} events`);
