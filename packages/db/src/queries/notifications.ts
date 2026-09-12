import { eq } from "drizzle-orm";
import { db } from "../client";
import { notificationPreferences } from "../schema/notifications";

export type NotificationPreferenceInput = {
  meetReminders: boolean;
  inviteEmails: boolean;
  safesportReminders: boolean;
  billingEmails: boolean;
  productUpdates: boolean;
};

const DEFAULTS: NotificationPreferenceInput = {
  meetReminders: true,
  inviteEmails: true,
  safesportReminders: true,
  billingEmails: true,
  productUpdates: false,
};

export async function getNotificationPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (!row) {
    return { userId, ...DEFAULTS, updatedAt: null as Date | null };
  }

  return row;
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: NotificationPreferenceInput,
) {
  await db
    .insert(notificationPreferences)
    .values({
      userId,
      ...prefs,
    })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { ...prefs, updatedAt: new Date() },
    });

  return getNotificationPreferences(userId);
}
