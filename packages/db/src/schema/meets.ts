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
import { organization } from "./auth";
import { courseEnum, eventGenderEnum, swimEvents } from "./events";
import { teamSeasons } from "./seasons";
import { swimmers, teamSwimmerMemberships } from "./swimmers";

export type EntryLimitPackage = {
  individual: number;
  relay: number;
};

export const meetCommitmentStatusEnum = pgEnum("meet_commitment_status", [
  "pending",
  "committed",
  "declined",
]);

export const meetEntryStatusEnum = pgEnum("meet_entry_status", [
  "draft",
  "approved",
  "scratched",
]);

export const seedTimeSourceEnum = pgEnum("seed_time_source", [
  "personal_best",
  "manual",
  "no_time",
]);

export type SeedTimeSource = (typeof seedTimeSourceEnum.enumValues)[number];

export const meets = pgTable("meets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  seasonId: text("season_id")
    .notNull()
    .references(() => teamSeasons.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  /** Deadline for entries to the meet host (from EV3 when imported). */
  entryDeadline: timestamp("entry_deadline"),
  course: courseEnum("course").notNull().default("SCY"),
  location: text("location"),
  address: text("address"),
  importSource: text("import_source"),
  rawFilePath: text("raw_file_path"),
  maxIndividualEntries: integer("max_individual_entries"),
  maxRelayEntries: integer("max_relay_entries"),
  maxCombinedEntries: integer("max_combined_entries"),
  entryLimitPackages: jsonb("entry_limit_packages").$type<
    EntryLimitPackage[] | null
  >(),
  entryLimitsSource: text("entry_limits_source"),
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
  gender: eventGenderEnum("gender").notNull(),
  ageGroup: text("age_group"),
  eventKey: text("event_key")
    .notNull()
    .references(() => swimEvents.eventKey),
  /** Meet-specific entry qualifying cut (from EV3/HYV), milliseconds. */
  qualifyingTimeMs: integer("qualifying_time_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetCommitments = pgTable("meet_commitments", {
  id: text("id").primaryKey(),
  meetId: text("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  membershipId: text("membership_id")
    .notNull()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  status: meetCommitmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  seedTimeSource: seedTimeSourceEnum("seed_time_source")
    .notNull()
    .default("no_time"),
  entryNotes: text("entry_notes"),
  status: meetEntryStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  previousBestTimeMs: integer("previous_best_time_ms"),
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

/** Coach-entered dated swims (club / mock / practice) for progression charts. */
export const swimmerTimeEntrySourceEnum = pgEnum("swimmer_time_entry_source", [
  "manual",
]);

export type SwimmerTimeEntrySource =
  (typeof swimmerTimeEntrySourceEnum.enumValues)[number];

export const swimmerTimeEntries = pgTable("swimmer_time_entries", {
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
  source: swimmerTimeEntrySourceEnum("source").notNull().default("manual"),
  label: text("label"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetRelayLegs = pgTable("meet_relay_legs", {
  id: text("id").primaryKey(),
  meetId: text("meet_id")
    .notNull()
    .references(() => meets.id, { onDelete: "cascade" }),
  meetEventId: text("meet_event_id")
    .notNull()
    .references(() => meetEvents.id, { onDelete: "cascade" }),
  legOrder: integer("leg_order").notNull(),
  membershipId: text("membership_id")
    .notNull()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  stroke: text("stroke"),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const timeStandardSets = pgTable("time_standard_sets", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  course: courseEnum("course").notNull().default("SCY"),
  seasonLabel: text("season_label"),
  sourceFilePath: text("source_file_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const timeStandardCuts = pgTable("time_standard_cuts", {
  id: text("id").primaryKey(),
  setId: text("set_id")
    .notNull()
    .references(() => timeStandardSets.id, { onDelete: "cascade" }),
  eventKey: text("event_key")
    .notNull()
    .references(() => swimEvents.eventKey),
  gender: eventGenderEnum("gender").notNull(),
  ageGroup: text("age_group").notNull(),
  timeMs: integer("time_ms").notNull(),
});

export const meetsRelations = relations(meets, ({ many, one }) => ({
  organization: one(organization, {
    fields: [meets.organizationId],
    references: [organization.id],
  }),
  season: one(teamSeasons, {
    fields: [meets.seasonId],
    references: [teamSeasons.id],
  }),
  events: many(meetEvents),
  entries: many(meetEntries),
  commitments: many(meetCommitments),
  results: many(meetResults),
  relayLegs: many(meetRelayLegs),
}));

export const meetCommitmentsRelations = relations(
  meetCommitments,
  ({ one }) => ({
    meet: one(meets, {
      fields: [meetCommitments.meetId],
      references: [meets.id],
    }),
    membership: one(teamSwimmerMemberships, {
      fields: [meetCommitments.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
  }),
);

export const meetEventsRelations = relations(meetEvents, ({ one, many }) => ({
  meet: one(meets, {
    fields: [meetEvents.meetId],
    references: [meets.id],
  }),
  entries: many(meetEntries),
  results: many(meetResults),
  relayLegs: many(meetRelayLegs),
}));

export const meetEntriesRelations = relations(meetEntries, ({ one }) => ({
  meet: one(meets, {
    fields: [meetEntries.meetId],
    references: [meets.id],
  }),
  meetEvent: one(meetEvents, {
    fields: [meetEntries.meetEventId],
    references: [meetEvents.id],
  }),
  membership: one(teamSwimmerMemberships, {
    fields: [meetEntries.membershipId],
    references: [teamSwimmerMemberships.id],
  }),
}));

export const meetResultsRelations = relations(meetResults, ({ one }) => ({
  meet: one(meets, {
    fields: [meetResults.meetId],
    references: [meets.id],
  }),
  meetEvent: one(meetEvents, {
    fields: [meetResults.meetEventId],
    references: [meetEvents.id],
  }),
  swimmer: one(swimmers, {
    fields: [meetResults.swimmerId],
    references: [swimmers.id],
  }),
}));

export const swimmerTimeEntriesRelations = relations(
  swimmerTimeEntries,
  ({ one }) => ({
    swimmer: one(swimmers, {
      fields: [swimmerTimeEntries.swimmerId],
      references: [swimmers.id],
    }),
    event: one(swimEvents, {
      fields: [swimmerTimeEntries.eventKey],
      references: [swimEvents.eventKey],
    }),
  }),
);

export const meetRelayLegsRelations = relations(meetRelayLegs, ({ one }) => ({
  meet: one(meets, {
    fields: [meetRelayLegs.meetId],
    references: [meets.id],
  }),
  meetEvent: one(meetEvents, {
    fields: [meetRelayLegs.meetEventId],
    references: [meetEvents.id],
  }),
  membership: one(teamSwimmerMemberships, {
    fields: [meetRelayLegs.membershipId],
    references: [teamSwimmerMemberships.id],
  }),
}));

export const timeStandardSetsRelations = relations(
  timeStandardSets,
  ({ many, one }) => ({
    organization: one(organization, {
      fields: [timeStandardSets.organizationId],
      references: [organization.id],
    }),
    cuts: many(timeStandardCuts),
  }),
);

export const timeStandardCutsRelations = relations(
  timeStandardCuts,
  ({ one }) => ({
    set: one(timeStandardSets, {
      fields: [timeStandardCuts.setId],
      references: [timeStandardSets.id],
    }),
  }),
);
