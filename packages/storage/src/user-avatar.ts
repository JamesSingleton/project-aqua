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
  USER_AVATAR_BUCKET,
  validateImageFile,
} from "./validate";

export type UploadUserAvatarResult = {
  publicUrl: string;
  path: string;
};

export async function uploadUserAvatar(options: {
  userId: string;
  file: ImageInput;
}): Promise<UploadUserAvatarResult> {
  const { userId, file } = options;
  if (!userId) {
    throw new ImageValidationError("userId is required");
  }

  const { mimeType, ext } = validateImageFile(file);
  const path = `${userId}/${randomUUID()}.${ext}`;
  await uploadPublicImage({
    client: getStorageClient(),
    bucket: USER_AVATAR_BUCKET,
    key: path,
    file,
    contentType: mimeType,
  });

  return {
    publicUrl: publicObjectPath(USER_AVATAR_BUCKET, path),
    path,
  };
}

export function userAvatarPathFromUrl(url: string): string | null {
  return objectKeyFromPublicUrl(USER_AVATAR_BUCKET, url);
}

export async function removeUserAvatar(options: {
  pathOrUrl: string;
}): Promise<void> {
  const path =
    options.pathOrUrl.includes("://") || options.pathOrUrl.startsWith("/")
      ? userAvatarPathFromUrl(options.pathOrUrl)
      : options.pathOrUrl;

  if (!path) return;

  await deleteObject({
    client: getStorageClient(),
    bucket: USER_AVATAR_BUCKET,
    key: path,
  });
}
