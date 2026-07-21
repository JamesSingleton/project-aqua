import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { trainingGroups } from "./groups";

export const genderEnum = pgEnum("gender", ["male", "female"]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "inactive",
]);
export const governingBodyEnum = pgEnum("governing_body", ["usa_swimming"]);

export const swimmers = pgTable(
  "swimmers",
  {
    id: text("id").primaryKey(),
    firstName: text("first_name").notNull(),
    middleName: text("middle_name"),
    lastName: text("last_name").notNull(),
    preferredName: text("preferred_name"),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: genderEnum("gender").notNull(),
    email: text("email"),
    phone: text("phone"),
    governingBody: governingBodyEnum("governing_body"),
    governingBodyId: text("governing_body_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("swimmers_governing_body_id_idx").on(table.governingBodyId),
  ],
);

export const teamSwimmerMemberships = pgTable(
  "team_swimmer_memberships",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    swimmerId: text("swimmer_id")
      .notNull()
      .references(() => swimmers.id, { onDelete: "cascade" }),
    /** @deprecated Prefer season_enrollments.group_id */
    groupId: text("group_id").references(() => trainingGroups.id, {
      onDelete: "set null",
    }),
    /** @deprecated Prefer groupId */ practiceGroup: text("practice_group"),
    /** @deprecated Prefer groupId */ trainingGroups:
      text("training_groups").array(),
    /** @deprecated Prefer season_enrollments.class_year */
    classYear: text("class_year"),
    status: membershipStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    leftAt: timestamp("left_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("team_swimmer_memberships_org_swimmer_idx").on(
      table.organizationId,
      table.swimmerId,
    ),
  ],
);

export const swimmerClubRegistrations = pgTable(
  "swimmer_club_registrations",
  {
    id: text("id").primaryKey(),
    membershipId: text("membership_id")
      .notNull()
      .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
    usaMemberId: text("usa_member_id").notNull(),
    clubId: text("club_id"),
    registrationStatus: text("registration_status"),
    swimsRecordId: text("swims_record_id"),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("swimmer_club_registrations_membership_idx").on(
      table.membershipId,
    ),
  ],
);

export const swimmerContacts = pgTable("swimmer_contacts", {
  membershipId: text("membership_id")
    .primaryKey()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  parentName: text("parent_name"),
  parentEmail: text("parent_email"),
  parentPhone: text("parent_phone"),
  emergencyName: text("emergency_name"),
  emergencyPhone: text("emergency_phone"),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  minorDirectContactConsent: boolean("minor_direct_contact_consent")
    .notNull()
    .default(false),
  minorDirectContactConsentedAt: timestamp("minor_direct_contact_consented_at"),
  minorDirectContactConsentedBy: text("minor_direct_contact_consented_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const swimmerMedical = pgTable("swimmer_medical", {
  membershipId: text("membership_id")
    .primaryKey()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  allergies: text("allergies"),
  medications: text("medications"),
  conditions: text("conditions"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  phone: text("phone"),
  certifications: text("certifications"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const swimmersRelations = relations(swimmers, ({ many }) => ({
  memberships: many(teamSwimmerMemberships),
}));

export const teamSwimmerMembershipsRelations = relations(
  teamSwimmerMemberships,
  ({ one }) => ({
    swimmer: one(swimmers, {
      fields: [teamSwimmerMemberships.swimmerId],
      references: [swimmers.id],
    }),
    organization: one(organization, {
      fields: [teamSwimmerMemberships.organizationId],
      references: [organization.id],
    }),
    clubRegistration: one(swimmerClubRegistrations, {
      fields: [teamSwimmerMemberships.id],
      references: [swimmerClubRegistrations.membershipId],
    }),
    contacts: one(swimmerContacts, {
      fields: [teamSwimmerMemberships.id],
      references: [swimmerContacts.membershipId],
    }),
    medical: one(swimmerMedical, {
      fields: [teamSwimmerMemberships.id],
      references: [swimmerMedical.membershipId],
    }),
  }),
);

export const swimmerClubRegistrationsRelations = relations(
  swimmerClubRegistrations,
  ({ one }) => ({
    membership: one(teamSwimmerMemberships, {
      fields: [swimmerClubRegistrations.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
  }),
);

export const swimmerContactsRelations = relations(
  swimmerContacts,
  ({ one }) => ({
    membership: one(teamSwimmerMemberships, {
      fields: [swimmerContacts.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
  }),
);

export const swimmerMedicalRelations = relations(swimmerMedical, ({ one }) => ({
  membership: one(teamSwimmerMemberships, {
    fields: [swimmerMedical.membershipId],
    references: [teamSwimmerMemberships.id],
  }),
}));
