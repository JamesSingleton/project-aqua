import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { teamSwimmerMemberships } from "./swimmers";

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "excused",
  "late",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "unknown",
  "attending",
  "absent",
  "maybe",
]);

export const practiceSessions = pgTable(
  "practice_sessions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    location: text("location"),
    notes: text("notes"),
    workoutId: text("workout_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("idx_practice_sessions_org").on(table.organizationId)],
);

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text("id").primaryKey(),
    practiceSessionId: text("practice_session_id")
      .notNull()
      .references(() => practiceSessions.id, { onDelete: "cascade" }),
    membershipId: text("membership_id")
      .notNull()
      .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("present"),
    rsvpStatus: rsvpStatusEnum("rsvp_status").notNull().default("unknown"),
    absenceReason: text("absence_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("attendance_records_practice_session_id_idx").on(
      table.practiceSessionId,
    ),
    index("attendance_records_membership_id_idx").on(table.membershipId),
  ],
);

export const practiceSessionsRelations = relations(
  practiceSessions,
  ({ many, one }) => ({
    organization: one(organization, {
      fields: [practiceSessions.organizationId],
      references: [organization.id],
    }),
    records: many(attendanceRecords),
  }),
);

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    session: one(practiceSessions, {
      fields: [attendanceRecords.practiceSessionId],
      references: [practiceSessions.id],
    }),
    membership: one(teamSwimmerMemberships, {
      fields: [attendanceRecords.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
  }),
);
