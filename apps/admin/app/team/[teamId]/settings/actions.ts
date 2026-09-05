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
import {
  normalizeLscCode,
  normalizeTeamCode,
} from "@project-aqua/swim-core/team-codes";
import { parseTeamType } from "@project-aqua/swim-core/team-types";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function emptyToNull(value: string | undefined, max: number): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export async function updateTeamProfileAction(
  teamId: string,
  input: {
    name: string;
    teamCode?: string;
    lscCode?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  },
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

    const combined = input.teamCode?.trim().toUpperCase() ?? "";
    const hyphenated = combined.match(/^([A-Z0-9]{2,5})-([A-Z]{2})$/);
    const teamCode = input.teamCode?.trim()
      ? normalizeTeamCode(input.teamCode)
      : null;
    let lscCode = input.lscCode?.trim()
      ? normalizeLscCode(input.lscCode)
      : null;
    if (!lscCode && hyphenated) lscCode = hyphenated[2]!;

    if (input.teamCode?.trim() && !teamCode) {
      return {
        ok: false,
        error: "Team abbreviation must be 2–5 letters (e.g. MARI, DSUN, AZSL)",
      };
    }
    if (input.lscCode?.trim() && !lscCode && !hyphenated) {
      return {
        ok: false,
        error: "LSC must be 2 letters (e.g. AZ, GA, PC)",
      };
    }

    const addressLine1 = emptyToNull(input.addressLine1, 60);
    const addressLine2 = emptyToNull(input.addressLine2, 60);
    const city = emptyToNull(input.city, 30);
    const regionRaw = input.region?.trim().toUpperCase() ?? "";
    if (regionRaw && !/^[A-Z]{2}$/.test(regionRaw)) {
      return { ok: false, error: "State must be a 2-letter code (e.g. AZ)" };
    }
    const postalCode = emptyToNull(input.postalCode, 10);
    const countryRaw = (input.country?.trim().toUpperCase() || "").slice(0, 3);
    const hasAddress = Boolean(
      addressLine1 || addressLine2 || city || regionRaw || postalCode,
    );
    const country = countryRaw || (hasAddress ? "USA" : "");

    await db
      .update(organization)
      .set({
        name,
        teamCode,
        lscCode,
        addressLine1,
        addressLine2,
        city,
        region: regionRaw || null,
        postalCode,
        country: country || null,
      })
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

export async function updateTeamTypeAction(
  teamId: string,
  teamTypeInput: string,
) {
  const session = await getSession();
  await requireTeamRole(session?.user?.id, teamId, ["owner", "head_coach"]);

  const teamType = parseTeamType(teamTypeInput);

  await db
    .update(organization)
    .set({ teamType })
    .where(eq(organization.id, teamId));

  revalidatePath(`/team/${teamId}`);
  revalidatePath(`/team/${teamId}/settings`);
  revalidatePath(`/team/${teamId}/settings/safesport`);
  revalidatePath(`/team/${teamId}/settings/usa-swimming`);
  revalidatePath(`/team/${teamId}/roster`);
}

const MAX_PRACTICE_LOCATION_LENGTH = 200;

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

    await db
      .update(organization)
      .set({ defaultPracticeLocation: location || null })
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
