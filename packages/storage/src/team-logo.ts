import { randomUUID } from "node:crypto";
import { getStorageClient } from "./client";
import {
  type ImageInput,
  ImageValidationError,
  TEAM_LOGO_BUCKET,
  validateImageFile,
} from "./validate";

export type UploadTeamLogoResult = {
  publicUrl: string;
  path: string;
};

function toUploadBody(
  data: ArrayBuffer | Uint8Array | Buffer,
): ArrayBuffer | Blob {
  if (data instanceof ArrayBuffer) return data;
  if (Buffer.isBuffer(data)) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
  }
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
}

/**
 * Upload a team logo to the `team-logos` bucket.
 * Path: `{teamId}/{uuid}.{ext}`
 */
export async function uploadTeamLogo(options: {
  teamId: string;
  file: ImageInput;
}): Promise<UploadTeamLogoResult> {
  const { teamId, file } = options;
  if (!teamId) {
    throw new ImageValidationError("teamId is required");
  }

  const { mimeType, ext } = validateImageFile(file);
  const path = `${teamId}/${randomUUID()}.${ext}`;
  const supabase = getStorageClient();

  const { error } = await supabase.storage
    .from(TEAM_LOGO_BUCKET)
    .upload(path, toUploadBody(file.data), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload team logo: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEAM_LOGO_BUCKET).getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    path,
  };
}

/** Extract object path from a public URL for this bucket, if possible. */
export function teamLogoPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = `/object/public/${TEAM_LOGO_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function removeTeamLogo(options: {
  pathOrUrl: string;
}): Promise<void> {
  const path =
    options.pathOrUrl.includes("://") || options.pathOrUrl.startsWith("/")
      ? teamLogoPathFromUrl(options.pathOrUrl)
      : options.pathOrUrl;

  if (!path) return;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(TEAM_LOGO_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to remove team logo: ${error.message}`);
  }
}
