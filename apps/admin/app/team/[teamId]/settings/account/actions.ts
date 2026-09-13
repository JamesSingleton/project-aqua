"use server";

import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamMember } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import {
  type NotificationPreferenceInput,
  upsertNotificationPreferences,
} from "@project-aqua/db/queries/notifications";
import {
  isThemePreference,
  upsertUserTheme,
} from "@project-aqua/db/queries/preferences";
import { member, user } from "@project-aqua/db/schema";
import {
  ImageValidationError,
  removeUserAvatar,
  uploadUserAvatar,
} from "@project-aqua/storage";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateAccountProfileAction(
  teamId: string,
  input: { name: string; title: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    await requireTeamMember(session.user.id, teamId);

    const name = input.name.trim();
    if (name.length < 1) {
      return { ok: false, error: "Name is required" };
    }

    await db
      .update(user)
      .set({ name, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    const membership = await getMember(session.user.id, teamId);
    if (membership) {
      await db
        .update(member)
        .set({ title: input.title.trim().slice(0, 80) || null })
        .where(
          and(eq(member.id, membership.id), eq(member.organizationId, teamId)),
        );
    }

    revalidatePath(`/team/${teamId}/settings/account`);
    revalidatePath(`/team/${teamId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

async function fileFromFormData(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return null;
  return {
    data: await file.arrayBuffer(),
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    size: file.size,
  };
}

export async function uploadAvatarAction(
  teamId: string,
  formData: FormData,
): Promise<{ ok: true; image: string } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    await requireTeamMember(session.user.id, teamId);

    const file = await fileFromFormData(formData);
    if (!file) {
      return { ok: false, error: "No avatar file provided" };
    }

    const [current] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const uploaded = await uploadUserAvatar({
      userId: session.user.id,
      file,
    });

    await db
      .update(user)
      .set({ image: uploaded.publicUrl, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    if (current?.image) {
      try {
        await removeUserAvatar({ pathOrUrl: current.image });
      } catch {
        // best-effort
      }
    }

    revalidatePath(`/team/${teamId}/settings/account`);
    revalidatePath(`/team/${teamId}`);
    return { ok: true, image: uploaded.publicUrl };
  } catch (err) {
    const message =
      err instanceof ImageValidationError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to upload avatar";
    return { ok: false, error: message };
  }
}

export async function removeAvatarAction(
  teamId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    await requireTeamMember(session.user.id, teamId);

    const [current] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (current?.image) {
      try {
        await removeUserAvatar({ pathOrUrl: current.image });
      } catch {
        // still clear DB
      }
    }

    await db
      .update(user)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    revalidatePath(`/team/${teamId}/settings/account`);
    revalidatePath(`/team/${teamId}`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to remove avatar",
    };
  }
}

export async function updateNotificationPreferencesAction(
  teamId: string,
  prefs: NotificationPreferenceInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    await requireTeamMember(session.user.id, teamId);
    await upsertNotificationPreferences(session.user.id, prefs);
    revalidatePath(`/team/${teamId}/settings/account`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to save notification preferences",
    };
  }
}

export async function updateThemeAction(
  teamId: string,
  theme: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }
    if (!isThemePreference(theme)) {
      return { ok: false, error: "Invalid theme" };
    }
    await requireTeamMember(session.user.id, teamId);
    await upsertUserTheme(session.user.id, theme);
    revalidatePath(`/team/${teamId}/settings/account`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save theme",
    };
  }
}
