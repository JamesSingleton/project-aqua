import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const notificationPreferences = pgTable("notification_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  meetReminders: boolean("meet_reminders").notNull().default(true),
  inviteEmails: boolean("invite_emails").notNull().default(true),
  safesportReminders: boolean("safesport_reminders").notNull().default(true),
  billingEmails: boolean("billing_emails").notNull().default(true),
  productUpdates: boolean("product_updates").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type NotificationPreferences =
  typeof notificationPreferences.$inferSelect;
