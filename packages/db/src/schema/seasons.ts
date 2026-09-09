import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { trainingGroups } from "./groups";
import { membershipStatusEnum, teamSwimmerMemberships } from "./swimmers";

export const eligibilityStatusEnum = pgEnum("eligibility_status", [
  "competing",
  "redshirt",
  "medical",
  "exhausted",
  "ineligible",
  "other",
]);

export const teamSeasons = pgTable(
  "team_seasons",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_seasons_org_label_idx").on(
      table.organizationId,
      table.label,
    ),
  ],
);

export const seasonEnrollments = pgTable(
  "season_enrollments",
  {
    id: text("id").primaryKey(),
    seasonId: text("season_id")
      .notNull()
      .references(() => teamSeasons.id, { onDelete: "cascade" }),
    membershipId: text("membership_id")
      .notNull()
      .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
    groupId: text("group_id").references(() => trainingGroups.id, {
      onDelete: "set null",
    }),
    /** High school class year: FR, SO, JR, SR */
    classYear: text("class_year"),
    /** College academic standing: FR, SO, JR, SR, GR */
    academicStanding: text("academic_standing"),
    eligibilityStatus: eligibilityStatusEnum("eligibility_status"),
    seasonsOfCompetitionUsed: integer("seasons_of_competition_used"),
    eligibilityNotes: text("eligibility_notes"),
    status: membershipStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("season_enrollments_season_membership_idx").on(
      table.seasonId,
      table.membershipId,
    ),
    index("season_enrollments_season_status_idx").on(
      table.seasonId,
      table.status,
    ),
    index("season_enrollments_membership_idx").on(table.membershipId),
  ],
);

export const teamSeasonsRelations = relations(teamSeasons, ({ one, many }) => ({
  organization: one(organization, {
    fields: [teamSeasons.organizationId],
    references: [organization.id],
  }),
  enrollments: many(seasonEnrollments),
}));

export const seasonEnrollmentsRelations = relations(
  seasonEnrollments,
  ({ one }) => ({
    season: one(teamSeasons, {
      fields: [seasonEnrollments.seasonId],
      references: [teamSeasons.id],
    }),
    membership: one(teamSwimmerMemberships, {
      fields: [seasonEnrollments.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
    group: one(trainingGroups, {
      fields: [seasonEnrollments.groupId],
      references: [trainingGroups.id],
    }),
  }),
);
