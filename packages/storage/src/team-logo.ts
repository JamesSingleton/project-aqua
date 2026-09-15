import { randomUUID } from "node:crypto";
import { getStorageClient } from "./client";
import {
  deleteObject,
  objectKeyFromPublicUrl,
  publicObjectPath,
  uploadPublicImage,
} from "./object";
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
  await uploadPublicImage({
    client: getStorageClient(),
    bucket: TEAM_LOGO_BUCKET,
    key: path,
    file,
    contentType: mimeType,
  });

  return {
    publicUrl: publicObjectPath(TEAM_LOGO_BUCKET, path),
    path,
  };
}

export function teamLogoPathFromUrl(url: string): string | null {
  return objectKeyFromPublicUrl(TEAM_LOGO_BUCKET, url);
}

export async function removeTeamLogo(options: {
  pathOrUrl: string;
}): Promise<void> {
  const path =
    options.pathOrUrl.includes("://") || options.pathOrUrl.startsWith("/")
      ? teamLogoPathFromUrl(options.pathOrUrl)
      : options.pathOrUrl;

  if (!path) return;

  await deleteObject({
    client: getStorageClient(),
    bucket: TEAM_LOGO_BUCKET,
    key: path,
  });
}
