import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";

export const courseEnum = pgEnum("course", ["SCY", "SCM", "LCM"]);

export const eventTypeEnum = pgEnum("event_type", ["individual", "relay"]);

/** Gender on events / meet events (athletes use swimmers.gender: male|female only). */
export const eventGenderEnum = pgEnum("event_gender", [
  "male",
  "female",
  "mixed",
]);

export type EventGender = (typeof eventGenderEnum.enumValues)[number];

export const swimEvents = pgTable("swim_events", {
  eventKey: text("event_key").primaryKey(),
  label: text("label").notNull(),
  distance: integer("distance").notNull(),
  stroke: text("stroke").notNull(),
  course: courseEnum("course").notNull(),
  gender: eventGenderEnum("gender").notNull(),
  eventType: eventTypeEnum("event_type").notNull().default("individual"),
  relayLegs: integer("relay_legs"),
});

export const swimEventsRelations = relations(swimEvents, () => ({}));
