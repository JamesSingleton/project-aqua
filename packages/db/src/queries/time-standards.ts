import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type EntryLimitPackage,
  swimEvents,
  timeStandardCuts,
  timeStandardSets,
} from "../schema/index";

function generateId(): string {
  return crypto.randomUUID();
}

async function touchTimeStandardSet(setId: string) {
  await db
    .update(timeStandardSets)
    .set({ updatedAt: new Date() })
    .where(eq(timeStandardSets.id, setId));
}

export async function listTimeStandardSets(organizationId: string) {
  return db
    .select()
    .from(timeStandardSets)
    .where(eq(timeStandardSets.organizationId, organizationId))
    .orderBy(asc(timeStandardSets.name));
}

export async function listTimeStandardSetsWithCounts(organizationId: string) {
  const sets = await listTimeStandardSets(organizationId);
  if (sets.length === 0) return [];

  const counts = await db
    .select({
      setId: timeStandardCuts.setId,
      cutCount: count(),
    })
    .from(timeStandardCuts)
    .innerJoin(
      timeStandardSets,
      eq(timeStandardCuts.setId, timeStandardSets.id),
    )
    .where(eq(timeStandardSets.organizationId, organizationId))
    .groupBy(timeStandardCuts.setId);

  const countBySet = new Map(
    counts.map((row) => [row.setId, Number(row.cutCount)]),
  );
  return sets.map((set) => ({
    ...set,
    cutCount: countBySet.get(set.id) ?? 0,
  }));
}

export async function listTimeStandardEvents() {
  return db
    .select({
      eventKey: swimEvents.eventKey,
      label: swimEvents.label,
      course: swimEvents.course,
      gender: swimEvents.gender,
      distance: swimEvents.distance,
      stroke: swimEvents.stroke,
    })
    .from(swimEvents)
    .orderBy(
      asc(swimEvents.course),
      asc(swimEvents.distance),
      asc(swimEvents.stroke),
      asc(swimEvents.gender),
    );
}

export async function getTimeStandardEvent(eventKey: string) {
  const [event] = await db
    .select()
    .from(swimEvents)
    .where(eq(swimEvents.eventKey, eventKey))
    .limit(1);
  return event ?? null;
}

export async function createTimeStandardSet(
  organizationId: string,
  data: {
    name: string;
    course: "SCY" | "SCM" | "LCM";
    seasonLabel?: string;
    sourceFilePath?: string;
  },
) {
  const id = generateId();
  await db.insert(timeStandardSets).values({
    id,
    organizationId,
    name: data.name,
    course: data.course,
    seasonLabel: data.seasonLabel ?? null,
    sourceFilePath: data.sourceFilePath ?? null,
  });
  return id;
}

export async function updateTimeStandardSet(
  organizationId: string,
  setId: string,
  data: {
    name: string;
    seasonLabel?: string | null;
  },
) {
  const name = data.name.trim();
  if (!name) throw new Error("Name is required");

  const [updated] = await db
    .update(timeStandardSets)
    .set({
      name,
      seasonLabel: data.seasonLabel?.trim() || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(timeStandardSets.id, setId),
        eq(timeStandardSets.organizationId, organizationId),
      ),
    )
    .returning({ id: timeStandardSets.id });

  return updated ?? null;
}

export async function deleteTimeStandardSet(
  organizationId: string,
  setId: string,
) {
  const [deleted] = await db
    .delete(timeStandardSets)
    .where(
      and(
        eq(timeStandardSets.id, setId),
        eq(timeStandardSets.organizationId, organizationId),
      ),
    )
    .returning({ id: timeStandardSets.id });
  return deleted ?? null;
}

export async function replaceTimeStandardCuts(
  setId: string,
  cuts: Array<{
    eventKey: string;
    gender: "male" | "female" | "mixed";
    ageGroup: string;
    timeMs: number;
  }>,
) {
  await db.delete(timeStandardCuts).where(eq(timeStandardCuts.setId, setId));
  if (cuts.length > 0) {
    await db.insert(timeStandardCuts).values(
      cuts.map((c) => ({
        id: generateId(),
        setId,
        eventKey: c.eventKey,
        gender: c.gender,
        ageGroup: c.ageGroup,
        timeMs: c.timeMs,
      })),
    );
  }
  await touchTimeStandardSet(setId);
}

export async function upsertTimeStandardCut(
  setId: string,
  cut: {
    eventKey: string;
    gender: "male" | "female" | "mixed";
    ageGroup: string;
    timeMs: number;
  },
) {
  const [existing] = await db
    .select({ id: timeStandardCuts.id })
    .from(timeStandardCuts)
    .where(
      and(
        eq(timeStandardCuts.setId, setId),
        eq(timeStandardCuts.eventKey, cut.eventKey),
        eq(timeStandardCuts.gender, cut.gender),
        eq(timeStandardCuts.ageGroup, cut.ageGroup),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(timeStandardCuts)
      .set({ timeMs: cut.timeMs })
      .where(eq(timeStandardCuts.id, existing.id));
    await touchTimeStandardSet(setId);
    return existing.id;
  }

  const id = generateId();
  await db.insert(timeStandardCuts).values({ id, setId, ...cut });
  await touchTimeStandardSet(setId);
  return id;
}

export async function updateTimeStandardCutTime(
  organizationId: string,
  cutId: string,
  timeMs: number,
) {
  const [cut] = await db
    .select({
      id: timeStandardCuts.id,
      setId: timeStandardCuts.setId,
    })
    .from(timeStandardCuts)
    .innerJoin(
      timeStandardSets,
      eq(timeStandardCuts.setId, timeStandardSets.id),
    )
    .where(
      and(
        eq(timeStandardCuts.id, cutId),
        eq(timeStandardSets.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!cut) return null;

  await db
    .update(timeStandardCuts)
    .set({ timeMs })
    .where(eq(timeStandardCuts.id, cutId));

  await touchTimeStandardSet(cut.setId);
  return cut;
}

export async function deleteTimeStandardCut(
  organizationId: string,
  cutId: string,
) {
  const [cut] = await db
    .select({
      id: timeStandardCuts.id,
      setId: timeStandardCuts.setId,
    })
    .from(timeStandardCuts)
    .innerJoin(
      timeStandardSets,
      eq(timeStandardCuts.setId, timeStandardSets.id),
    )
    .where(
      and(
        eq(timeStandardCuts.id, cutId),
        eq(timeStandardSets.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!cut) return null;

  await db.delete(timeStandardCuts).where(eq(timeStandardCuts.id, cutId));
  await touchTimeStandardSet(cut.setId);
  return cut;
}

export async function getTimeStandardCuts(setId: string) {
  return db
    .select({
      id: timeStandardCuts.id,
      setId: timeStandardCuts.setId,
      eventKey: timeStandardCuts.eventKey,
      gender: timeStandardCuts.gender,
      ageGroup: timeStandardCuts.ageGroup,
      timeMs: timeStandardCuts.timeMs,
      eventLabel: swimEvents.label,
    })
    .from(timeStandardCuts)
    .leftJoin(swimEvents, eq(timeStandardCuts.eventKey, swimEvents.eventKey))
    .where(eq(timeStandardCuts.setId, setId))
    .orderBy(
      asc(timeStandardCuts.gender),
      asc(timeStandardCuts.ageGroup),
      asc(timeStandardCuts.eventKey),
    );
}

export async function getTimeStandardCutsForLookup(
  organizationId: string,
  setId: string,
) {
  const [set] = await db
    .select()
    .from(timeStandardSets)
    .where(
      and(
        eq(timeStandardSets.id, setId),
        eq(timeStandardSets.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!set) return null;
  const cuts = await getTimeStandardCuts(setId);
  return { set, cuts };
}

export type { EntryLimitPackage };
