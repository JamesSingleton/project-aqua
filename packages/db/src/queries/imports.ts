import { desc, eq } from "drizzle-orm";
import { db } from "../client.js";
import { importJobs } from "../schema/index.js";

function generateId(): string {
  return crypto.randomUUID();
}

export async function createImportJob(
  organizationId: string,
  type: string,
  filePath?: string,
) {
  const id = generateId();
  await db.insert(importJobs).values({
    id,
    organizationId,
    type,
    filePath: filePath ?? null,
    status: "pending",
  });
  return id;
}

export async function updateImportJob(
  jobId: string,
  data: {
    status: "pending" | "processing" | "complete" | "failed";
    errors?: string;
    resultSummary?: string;
  },
) {
  await db
    .update(importJobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(importJobs.id, jobId));
}

export async function getImportJobs(organizationId: string) {
  return db
    .select()
    .from(importJobs)
    .where(eq(importJobs.organizationId, organizationId))
    .orderBy(desc(importJobs.createdAt));
}

export async function getImportJob(jobId: string) {
  const [job] = await db
    .select()
    .from(importJobs)
    .where(eq(importJobs.id, jobId))
    .limit(1);
  return job ?? null;
}
