import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { keys } from "./keys";
import type { ImageInput } from "./validate";

const PUBLIC_CACHE_CONTROL = "public, max-age=31536000, immutable";

function encodeObjectKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function uploadBody(data: ImageInput["data"]): Uint8Array {
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return Uint8Array.from(data);
}

export function storageObjectUrl(bucket: string, key: string): string {
  const endpoint = new URL(keys().AWS_ENDPOINT_URL_S3);
  endpoint.pathname = `${endpoint.pathname.replace(/\/$/, "")}/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`;
  return endpoint.toString();
}

export function publicObjectPath(bucket: string, key: string): string {
  return `/api/storage/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`;
}

export function objectKeyFromPublicUrl(
  bucket: string,
  value: string,
): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value, "https://aqua.invalid");
  } catch {
    return null;
  }

  const publicPathPrefix = `/api/storage/${encodeURIComponent(bucket)}/`;
  if (
    parsed.origin === "https://aqua.invalid" &&
    parsed.pathname.startsWith(publicPathPrefix)
  ) {
    const encodedKey = parsed.pathname.slice(publicPathPrefix.length);
    if (!encodedKey) return null;
    try {
      return encodedKey.split("/").map(decodeURIComponent).join("/");
    } catch {
      return null;
    }
  }

  const endpoint = new URL(keys().AWS_ENDPOINT_URL_S3);
  if (parsed.origin !== endpoint.origin) return null;

  const prefix = `${endpoint.pathname.replace(/\/$/, "")}/${encodeURIComponent(bucket)}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;

  const encodedKey = parsed.pathname.slice(prefix.length);
  if (!encodedKey) return null;

  try {
    return encodedKey.split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}

export async function uploadPublicImage(options: {
  client: S3Client;
  bucket: string;
  key: string;
  file: ImageInput;
  contentType: string;
}): Promise<void> {
  await options.client.send(
    new PutObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
      Body: uploadBody(options.file.data),
      ContentType: options.contentType,
      CacheControl: PUBLIC_CACHE_CONTROL,
    }),
  );
}

export async function deleteObject(options: {
  client: S3Client;
  bucket: string;
  key: string;
}): Promise<void> {
  await options.client.send(
    new DeleteObjectCommand({
      Bucket: options.bucket,
      Key: options.key,
    }),
  );
}
