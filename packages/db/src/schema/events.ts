import { relations } from "drizzle-orm";
import { integer, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { courseEnum } from "./meets.js";

export const eventTypeEnum = pgEnum("event_type", ["individual", "relay"]);

export const swimEvents = pgTable("swim_events", {
  eventKey: text("event_key").primaryKey(),
  label: text("label").notNull(),
  distance: integer("distance").notNull(),
  stroke: text("stroke").notNull(),
  course: courseEnum("course").notNull(),
  gender: text("gender").notNull(),
  eventType: eventTypeEnum("event_type").notNull().default("individual"),
  relayLegs: integer("relay_legs"),
});

export const swimEventsRelations = relations(swimEvents, () => ({}));
