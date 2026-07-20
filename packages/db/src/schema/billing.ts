import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "./auth";

export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "enterprise"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),
  /** @deprecated SaaS billing moved to Polar — kept for migration */ stripeCustomerId:
    text("stripe_customer_id"),
  /** @deprecated SaaS billing moved to Polar — kept for migration */ stripeSubscriptionId:
    text("stripe_subscription_id"),
  polarCustomerId: text("polar_customer_id"),
  polarSubscriptionId: text("polar_subscription_id"),
  plan: planTierEnum("plan").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const importJobStatusEnum = pgEnum("import_job_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const importJobs = pgTable("import_jobs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  status: importJobStatusEnum("status").notNull().default("pending"),
  filePath: text("file_path"),
  errors: text("errors"),
  resultSummary: text("result_summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organization, {
    fields: [subscriptions.organizationId],
    references: [organization.id],
  }),
}));
