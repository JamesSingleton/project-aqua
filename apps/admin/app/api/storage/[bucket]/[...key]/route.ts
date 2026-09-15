import {
  storageObjectUrl,
  TEAM_LOGO_BUCKET,
  USER_AVATAR_BUCKET,
} from "@project-aqua/storage";

type StorageBucket = typeof TEAM_LOGO_BUCKET | typeof USER_AVATAR_BUCKET;

function isStorageBucket(value: string): value is StorageBucket {
  return value === TEAM_LOGO_BUCKET || value === USER_AVATAR_BUCKET;
}

async function serveObject(
  request: Request,
  context: { params: Promise<{ bucket: string; key: string[] }> },
) {
  const { bucket, key } = await context.params;
  if (!isStorageBucket(bucket) || key.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const objectResponse = await fetch(storageObjectUrl(bucket, key.join("/")), {
    method: request.method,
  });
  if (!objectResponse.ok) {
    return new Response("Not found", { status: objectResponse.status });
  }

  const headers = new Headers();
  for (const name of [
    "cache-control",
    "content-length",
    "content-type",
    "etag",
    "last-modified",
  ]) {
    const value = objectResponse.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(request.method === "HEAD" ? null : objectResponse.body, {
    status: 200,
    headers,
  });
}

export const GET = serveObject;
export const HEAD = serveObject;
