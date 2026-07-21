"use server";

import { getSession } from "@project-aqua/auth/session";
import { requireTeamRole } from "@project-aqua/db/authz";
import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import {
  ImageValidationError,
  removeTeamLogo,
  uploadTeamLogo,
} from "@project-aqua/storage";
import { parseTeamType } from "@project-aqua/swim-core/team-types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateTeamProfileAction(
  teamId: string,
  input: { name: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    await requireTeamRole(session?.user?.id, teamId, [
      "owner",
      "admin",
      "head_coach",
    ]);

    const name = input.name.trim();

    if (name.length < 2) {
      return { ok: false, error: "Team name must be at least 2 characters" };
    }

    // Names are not unique — many clubs share names across states/regions.
    // Org slug stays an internal Better Auth identifier (set at create time).
    await db
      .update(organization)
      .set({ name })
      .where(eq(organization.id, teamId));

    revalidatePath(`/team/${teamId}`);
    revalidatePath(`/team/${teamId}/settings`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update team",
    };
  }
}

const MAX_PRACTICE_LOCATION_LENGTH = 200;

function parseOrganizationMetadata(
  raw: string | null | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function updateTeamTypeAction(
  teamId: string,
  teamTypeInput: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const teamType = parseTeamType(teamTypeInput);

  const [org] = await db
    .select({ metadata: organization.metadata })
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const metadata = parseOrganizationMetadata(org?.metadata);
  metadata.teamType = teamType;

  await db
    .update(organization)
    .set({ metadata: JSON.stringify(metadata) })
    .where(eq(organization.id, teamId));

  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/team/${teamId}/settings`);
  revalidatePath(`/team/${teamId}/settings/safesport`);
  revalidatePath(`/team/${teamId}/settings/usa-swimming`);
  revalidatePath(`/team/${teamId}/roster`);
}

export async function updateDefaultPracticeLocationAction(
  teamId: string,
  input: { location: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    await requireTeamRole(session?.user?.id, teamId, [
      "owner",
      "admin",
      "head_coach",
    ]);

    const location = input.location.trim();
    if (location.length > MAX_PRACTICE_LOCATION_LENGTH) {
      return {
        ok: false,
        error: `Location must be ${MAX_PRACTICE_LOCATION_LENGTH} characters or fewer`,
      };
    }

    const [org] = await db
      .select({ metadata: organization.metadata })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1);

    const metadata = parseOrganizationMetadata(org?.metadata);
    if (location) {
      metadata.defaultPracticeLocation = location;
    } else {
      delete metadata.defaultPracticeLocation;
    }

    await db
      .update(organization)
      .set({ metadata: JSON.stringify(metadata) })
      .where(eq(organization.id, teamId));

    revalidatePath(`/team/${teamId}`);
    revalidatePath(`/team/${teamId}/settings`);
    revalidatePath(`/team/${teamId}/attendance`);
    revalidatePath(`/team/${teamId}/calendar`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update practice location",
    };
  }
}

async function fileFromFormData(formData: FormData): Promise<{
  data: ArrayBuffer;
  mimeType: string;
  fileName: string;
  size: number;
} | null> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;
  return {
    data: await file.arrayBuffer(),
    mimeType: file.type || "application/octet-stream",
    fileName: file.name,
    size: file.size,
  };
}

export async function uploadTeamLogoAction(
  teamId: string,
  formData: FormData,
): Promise<{ ok: true; logo: string } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    await requireTeamRole(session?.user?.id, teamId, [
      "owner",
      "admin",
      "head_coach",
    ]);

    const file = await fileFromFormData(formData);
    if (!file) {
      return { ok: false, error: "No logo file provided" };
    }

    const [org] = await db
      .select({ logo: organization.logo })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1);

    const uploaded = await uploadTeamLogo({ teamId, file });

    await db
      .update(organization)
      .set({ logo: uploaded.publicUrl })
      .where(eq(organization.id, teamId));

    if (org?.logo) {
      try {
        await removeTeamLogo({ pathOrUrl: org.logo });
      } catch {
        // Best-effort cleanup of the previous object
      }
    }

    revalidatePath(`/team/${teamId}`);
    revalidatePath(`/team/${teamId}/settings`);
    return { ok: true, logo: uploaded.publicUrl };
  } catch (err) {
    const message =
      err instanceof ImageValidationError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to upload logo";
    return { ok: false, error: message };
  }
}

export async function removeTeamLogoAction(
  teamId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await getSession();
    await requireTeamRole(session?.user?.id, teamId, [
      "owner",
      "admin",
      "head_coach",
    ]);

    const [org] = await db
      .select({ logo: organization.logo })
      .from(organization)
      .where(eq(organization.id, teamId))
      .limit(1);

    if (org?.logo) {
      try {
        await removeTeamLogo({ pathOrUrl: org.logo });
      } catch {
        // Still clear the DB field even if storage delete fails
      }
    }

    await db
      .update(organization)
      .set({ logo: null })
      .where(eq(organization.id, teamId));

    revalidatePath(`/team/${teamId}`);
    revalidatePath(`/team/${teamId}/settings`);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to remove logo",
    };
  }
}
