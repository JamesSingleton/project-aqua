export const TEAM_LOGO_BUCKET = "team-logos";
export const USER_AVATAR_BUCKET = "user-avatars";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const MIME_TO_EXT: Record<AllowedImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

export type ImageInput = {
  data: ArrayBuffer | Uint8Array | Buffer;
  mimeType: string;
  /** Optional original filename for extension fallback */
  fileName?: string;
  size?: number;
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export function isAllowedImageMimeType(
  mimeType: string,
): mimeType is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function extensionForMimeType(mimeType: AllowedImageMimeType): string {
  return MIME_TO_EXT[mimeType];
}

export function validateImageFile(input: ImageInput): {
  mimeType: AllowedImageMimeType;
  size: number;
  ext: string;
} {
  const size =
    input.size ??
    (input.data instanceof ArrayBuffer
      ? input.data.byteLength
      : input.data.byteLength);

  if (size <= 0) {
    throw new ImageValidationError("Image file is empty");
  }

  if (size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(
      `Image must be ${MAX_IMAGE_BYTES / (1024 * 1024)} MB or smaller`,
    );
  }

  const mimeType = input.mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!isAllowedImageMimeType(mimeType)) {
    throw new ImageValidationError(
      "Image must be JPEG, PNG, WebP, AVIF, or SVG",
    );
  }

  return {
    mimeType,
    size,
    ext: extensionForMimeType(mimeType),
  };
}
