import { randomUUID } from "node:crypto";
import { getStorageClient } from "./client";
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
  const supabase = getStorageClient();

  const { error } = await supabase.storage
    .from(USER_AVATAR_BUCKET)
    .upload(path, toUploadBody(file.data), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }

  const { data } = supabase.storage.from(USER_AVATAR_BUCKET).getPublicUrl(path);

  return {
    publicUrl: data.publicUrl,
    path,
  };
}

export function userAvatarPathFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = `/object/public/${USER_AVATAR_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function removeUserAvatar(options: {
  pathOrUrl: string;
}): Promise<void> {
  const path =
    options.pathOrUrl.includes("://") || options.pathOrUrl.startsWith("/")
      ? userAvatarPathFromUrl(options.pathOrUrl)
      : options.pathOrUrl;

  if (!path) return;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(USER_AVATAR_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to remove avatar: ${error.message}`);
  }
}
