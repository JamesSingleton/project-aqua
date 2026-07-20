import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamMember } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { getNotificationPreferences } from "@project-aqua/db/queries/notifications";
import { getUserPreferences } from "@project-aqua/db/queries/preferences";
import { user } from "@project-aqua/db/schema";
import { eq } from "drizzle-orm";
import { SettingsSection } from "../settings-section";
import { AccountAppearanceForm } from "./account-appearance-form";
import { AccountNotificationsForm } from "./account-notifications-form";
import { AccountProfileForm } from "./account-profile-form";
import { AccountSecurityForm } from "./account-security-form";

export default async function AccountSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  await requireTeamMember(session.user.id, teamId);

  const [profile, membership, prefs, userPrefs] = await Promise.all([
    db
      .select({
        name: user.name,
        email: user.email,
        image: user.image,
        twoFactorEnabled: user.twoFactorEnabled,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
      .then((rows) => rows[0]),
    getMember(session.user.id, teamId),
    getNotificationPreferences(session.user.id),
    getUserPreferences(session.user.id),
  ]);

  return (
    <div className="flex flex-col">
      <SettingsSection
        title="Profile"
        description="Your name, photo, and title on this team."
      >
        <AccountProfileForm
          teamId={teamId}
          name={profile?.name ?? session.user.name}
          email={profile?.email ?? session.user.email}
          title={membership?.title ?? ""}
          image={profile?.image ?? null}
        />
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Password and two-factor authentication."
        showSeparator
      >
        <AccountSecurityForm
          twoFactorEnabled={profile?.twoFactorEnabled ?? false}
        />
      </SettingsSection>

      <SettingsSection
        title="Appearance"
        description="Choose how Project Aqua looks across your devices."
        showSeparator
      >
        <AccountAppearanceForm teamId={teamId} initialTheme={userPrefs.theme} />
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        description="Choose which email notices you want to receive. Email senders will respect these preferences as they are wired up."
        showSeparator
      >
        <AccountNotificationsForm
          teamId={teamId}
          initial={{
            meetReminders: prefs.meetReminders,
            inviteEmails: prefs.inviteEmails,
            safesportReminders: prefs.safesportReminders,
            billingEmails: prefs.billingEmails,
            productUpdates: prefs.productUpdates,
          }}
        />
      </SettingsSection>
    </div>
  );
}
