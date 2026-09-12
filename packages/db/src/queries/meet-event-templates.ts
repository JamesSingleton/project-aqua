import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import type { MeetEventTemplateRow } from "../schema/meets";
import { meetEventTemplates } from "../schema/meets";

const MAX_TEAM_TEMPLATES = 20;

function generateId(): string {
  return crypto.randomUUID();
}

/** True when the meet_event_templates migration has not been applied yet. */
export function isMeetEventTemplatesTableMissing(error: unknown): boolean {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  const combined = parts.join(" ");
  return (
    combined.includes("meet_event_templates") &&
    combined.includes("does not exist")
  );
}

export async function listMeetEventTemplates(organizationId: string) {
  return db
    .select()
    .from(meetEventTemplates)
    .where(eq(meetEventTemplates.organizationId, organizationId))
    .orderBy(desc(meetEventTemplates.updatedAt));
}

/** Like listMeetEventTemplates, but returns [] until migrations are applied. */
export async function listMeetEventTemplatesSafe(organizationId: string) {
  try {
    return await listMeetEventTemplates(organizationId);
  } catch (error) {
    if (isMeetEventTemplatesTableMissing(error)) return [];
    throw error;
  }
}

export async function getMeetEventTemplateById(
  templateId: string,
  organizationId: string,
) {
  const [row] = await db
    .select()
    .from(meetEventTemplates)
    .where(
      and(
        eq(meetEventTemplates.id, templateId),
        eq(meetEventTemplates.organizationId, organizationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function countMeetEventTemplates(organizationId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meetEventTemplates)
    .where(eq(meetEventTemplates.organizationId, organizationId));
  return row?.count ?? 0;
}

export async function createMeetEventTemplate(
  organizationId: string,
  input: {
    name: string;
    course: "SCY" | "SCM" | "LCM";
    events: MeetEventTemplateRow[];
  },
) {
  const count = await countMeetEventTemplates(organizationId);
  if (count >= MAX_TEAM_TEMPLATES) {
    throw new Error(
      `Team template limit reached (${MAX_TEAM_TEMPLATES}). Delete one to save another.`,
    );
  }

  const id = generateId();
  await db.insert(meetEventTemplates).values({
    id,
    organizationId,
    name: input.name,
    course: input.course,
    events: input.events,
  });
  return id;
}

export async function deleteMeetEventTemplate(
  templateId: string,
  organizationId: string,
) {
  const existing = await getMeetEventTemplateById(templateId, organizationId);
  if (!existing) return false;

  await db
    .delete(meetEventTemplates)
    .where(eq(meetEventTemplates.id, templateId));

  return true;
}

export { MAX_TEAM_TEMPLATES };
