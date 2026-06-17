import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.js";
import { swimEvents } from "./events.js";
import { swimmers, teamSwimmerMemberships } from "./swimmers.js";

export const courseEnum = pgEnum("course", ["SCY", "SCM", "LCM"]);

export const meets = pgTable("meets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  course: courseEnum("course").notNull().default("SCY"),
  location: text("location"),
  importSource: text("import_source"),
  rawFilePath: text("raw_file_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetEvents = pgTable("meet_events", {
  id: text("id").primaryKey(),
  meetId: text("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  eventNumber: integer("event_number"),
  stroke: text("stroke").notNull(),
  distance: integer("distance").notNull(),
  gender: text("gender").notNull(),
  ageGroup: text("age_group"),
  eventKey: text("event_key")
    .notNull()
    .references(() => swimEvents.eventKey),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetEntries = pgTable("meet_entries", {
  id: text("id").primaryKey(),
  meetId: text("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  meetEventId: text("meet_event_id")
    .notNull()
    .references(() => meetEvents.id, { onDelete: "cascade" }),
  membershipId: text("membership_id")
    .notNull()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  seedTimeMs: integer("seed_time_ms"),
  entryNotes: text("entry_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetResults = pgTable("meet_results", {
  id: text("id").primaryKey(),
  meetId: text("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  meetEventId: text("meet_event_id")
    .notNull()
    .references(() => meetEvents.id, { onDelete: "cascade" }),
  swimmerId: text("swimmer_id")
    .notNull()
    .references(() => swimmers.id, { onDelete: "cascade" }),
  timeMs: integer("time_ms").notNull(),
  place: integer("place"),
  isDq: boolean("is_dq").notNull().default(false),
  splitTimes: jsonb("split_times"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const swimmerBestTimes = pgTable("swimmer_best_times", {
  id: text("id").primaryKey(),
  swimmerId: text("swimmer_id")
    .notNull()
    .references(() => swimmers.id, { onDelete: "cascade" }),
  eventKey: text("event_key")
    .notNull()
    .references(() => swimEvents.eventKey),
  course: courseEnum("course").notNull(),
  timeMs: integer("time_ms").notNull(),
  achievedAt: timestamp("achieved_at").notNull(),
  meetId: text("meet_id").references(() => meets.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetsRelations = relations(meets, ({ many, one }) => ({
  organization: one(organization, {
    fields: [meets.organizationId],
    references: [organization.id],
  }),
  events: many(meetEvents),
  entries: many(meetEntries),
  results: many(meetResults),
}));

export const meetEventsRelations = relations(meetEvents, ({ one, many }) => ({
  meet: one(meets, {
    fields: [meetEvents.meetId],
    references: [meets.id],
  }),
  entries: many(meetEntries),
  results: many(meetResults),
}));
