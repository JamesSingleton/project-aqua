import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const workoutIntensityEnum = pgEnum("workout_intensity", [
  "easy",
  "moderate",
  "threshold",
  "race",
  "sprint",
  "recovery",
  "unknown",
]);

export const workouts = pgTable("workouts", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),
  totalDistance: integer("total_distance"),
  practiceGroup: text("practice_group"),
  wasAiGenerated: boolean("was_ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  aiDraftText: text("ai_draft_text"),
  editDistance: integer("edit_distance"),
  createdByUserId: text("created_by_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workoutSets = pgTable("workout_sets", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  section: text("section"),
  reps: integer("reps").notNull().default(1),
  distance: integer("distance").notNull(),
  stroke: text("stroke").notNull().default("free"),
  intensity: workoutIntensityEnum("intensity").notNull().default("unknown"),
  interval: text("interval"),
  notes: text("notes"),
  rawLine: text("raw_line"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  organization: one(organization, {
    fields: [workouts.organizationId],
    references: [organization.id],
  }),
  sets: many(workoutSets),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutSets.workoutId],
    references: [workouts.id],
  }),
}));
