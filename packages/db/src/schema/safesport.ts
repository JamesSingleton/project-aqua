import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { member, organization } from "./auth.js";
import { teamSwimmerMemberships } from "./swimmers.js";

export const credentialTypeEnum = pgEnum("credential_type", [
  "safesport_core",
  "safesport_refresher_1",
  "safesport_refresher_2",
  "safesport_refresher_3",
  "background_check",
  "cpr_aed",
  "stsc",
]);

export const credentialStatusEnum = pgEnum("credential_status", [
  "current",
  "expired",
  "pending",
  "not_started",
]);

export const credentialVerifiedByEnum = pgEnum("credential_verified_by", [
  "manual_upload",
  "usa_swimming_sync",
  "safesport_lms_webhook",
]);

export const acknowledgmentByEnum = pgEnum("acknowledgment_by", [
  "parent_guardian",
  "athlete",
  "adult_athlete",
]);

export const reportCategoryEnum = pgEnum("report_category", [
  "emotional_misconduct",
  "physical_misconduct",
  "sexual_misconduct",
  "maapp_violation",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "submitted",
  "under_review",
  "resolved",
  "referred_to_center",
]);

export const staffCredentials = pgTable("staff_credentials", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  credentialType: credentialTypeEnum("credential_type").notNull(),
  status: credentialStatusEnum("status").notNull().default("not_started"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  externalId: text("external_id"),
  verifiedBy: credentialVerifiedByEnum("verified_by")
    .notNull()
    .default("manual_upload"),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const maappAcknowledgments = pgTable("maapp_acknowledgments", {
  id: text("id").primaryKey(),
  membershipId: text("membership_id")
    .notNull()
    .references(() => teamSwimmerMemberships.id, { onDelete: "cascade" }),
  acknowledgedBy: acknowledgmentByEnum("acknowledged_by").notNull(),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email").notNull(),
  seasonYear: text("season_year").notNull(),
  acknowledgedAt: timestamp("acknowledged_at").notNull().defaultNow(),
  documentVersion: text("document_version").notNull().default("2025"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const safesportReports = pgTable("safesport_reports", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  reportedByUserId: text("reported_by_user_id").notNull(),
  subjectDescription: text("subject_description").notNull(),
  category: reportCategoryEnum("category").notNull(),
  status: reportStatusEnum("status").notNull().default("submitted"),
  referredToCenterAt: timestamp("referred_to_center_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const staffCredentialsRelations = relations(
  staffCredentials,
  ({ one }) => ({
    member: one(member, {
      fields: [staffCredentials.memberId],
      references: [member.id],
    }),
  }),
);

export const maappAcknowledgmentsRelations = relations(
  maappAcknowledgments,
  ({ one }) => ({
    membership: one(teamSwimmerMemberships, {
      fields: [maappAcknowledgments.membershipId],
      references: [teamSwimmerMemberships.id],
    }),
  }),
);

export const safesportReportsRelations = relations(
  safesportReports,
  ({ one }) => ({
    organization: one(organization, {
      fields: [safesportReports.organizationId],
      references: [organization.id],
    }),
  }),
);
