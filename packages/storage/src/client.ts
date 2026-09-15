import { S3Client } from "@aws-sdk/client-s3";
import { keys } from "./keys";

let client: S3Client | null = null;

export function getStorageClient(): S3Client {
  if (client) return client;

  const env = keys();
  client = new S3Client({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });

  return client;
}
