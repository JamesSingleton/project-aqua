import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../client";
import { practiceSessions, workoutSets, workouts } from "../schema/index";

function generateId(): string {
  return crypto.randomUUID();
}

export type WorkoutSetInput = {
  sortOrder: number;
  section?: string | null;
  reps: number;
  distance: number;
  stroke: string;
  intensity:
    | "easy"
    | "moderate"
    | "threshold"
    | "race"
    | "sprint"
    | "recovery"
    | "unknown";
  interval?: string | null;
  notes?: string | null;
  rawLine?: string | null;
};

export async function listWorkouts(organizationId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.organizationId, organizationId))
    .orderBy(desc(workouts.createdAt));
}

export async function getRecentWorkouts(organizationId: string, limit = 8) {
  return db
    .select({
      id: workouts.id,
      title: workouts.title,
      rawText: workouts.rawText,
      totalDistance: workouts.totalDistance,
      createdAt: workouts.createdAt,
    })
    .from(workouts)
    .where(eq(workouts.organizationId, organizationId))
    .orderBy(desc(workouts.createdAt))
    .limit(limit);
}

export async function getWorkoutById(
  workoutId: string,
  organizationId: string,
) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.organizationId, organizationId),
      ),
    )
    .limit(1);
  if (!workout) return null;

  const sets = await db
    .select()
    .from(workoutSets)
    .where(eq(workoutSets.workoutId, workoutId))
    .orderBy(asc(workoutSets.sortOrder));

  return { ...workout, sets };
}

export async function createWorkout(
  organizationId: string,
  data: {
    title: string;
    rawText: string;
    totalDistance?: number | null;
    practiceGroup?: string | null;
    wasAiGenerated?: boolean;
    aiPrompt?: string | null;
    aiDraftText?: string | null;
    editDistance?: number | null;
    createdByUserId?: string | null;
    sets: WorkoutSetInput[];
  },
) {
  const id = generateId();
  await db.insert(workouts).values({
    id,
    organizationId,
    title: data.title,
    rawText: data.rawText,
    totalDistance: data.totalDistance ?? null,
    practiceGroup: data.practiceGroup ?? null,
    wasAiGenerated: data.wasAiGenerated ?? false,
    aiPrompt: data.aiPrompt ?? null,
    aiDraftText: data.aiDraftText ?? null,
    editDistance: data.editDistance ?? null,
    createdByUserId: data.createdByUserId ?? null,
  });

  if (data.sets.length > 0) {
    await db.insert(workoutSets).values(
      data.sets.map((set) => ({
        id: generateId(),
        workoutId: id,
        sortOrder: set.sortOrder,
        section: set.section ?? null,
        reps: set.reps,
        distance: set.distance,
        stroke: set.stroke,
        intensity: set.intensity,
        interval: set.interval ?? null,
        notes: set.notes ?? null,
        rawLine: set.rawLine ?? null,
      })),
    );
  }

  return id;
}

export async function updateWorkout(
  workoutId: string,
  organizationId: string,
  data: {
    title: string;
    rawText: string;
    totalDistance?: number | null;
    practiceGroup?: string | null;
    aiDraftText?: string | null;
    editDistance?: number | null;
    sets: WorkoutSetInput[];
  },
) {
  const existing = await getWorkoutById(workoutId, organizationId);
  if (!existing) return null;

  await db
    .update(workouts)
    .set({
      title: data.title,
      rawText: data.rawText,
      totalDistance: data.totalDistance ?? null,
      practiceGroup: data.practiceGroup ?? null,
      aiDraftText: data.aiDraftText ?? existing.aiDraftText,
      editDistance: data.editDistance ?? existing.editDistance,
      updatedAt: new Date(),
    })
    .where(eq(workouts.id, workoutId));

  await db.delete(workoutSets).where(eq(workoutSets.workoutId, workoutId));

  if (data.sets.length > 0) {
    await db.insert(workoutSets).values(
      data.sets.map((set) => ({
        id: generateId(),
        workoutId,
        sortOrder: set.sortOrder,
        section: set.section ?? null,
        reps: set.reps,
        distance: set.distance,
        stroke: set.stroke,
        intensity: set.intensity,
        interval: set.interval ?? null,
        notes: set.notes ?? null,
        rawLine: set.rawLine ?? null,
      })),
    );
  }

  return workoutId;
}

export async function attachWorkoutToPractice(
  practiceSessionId: string,
  organizationId: string,
  workoutId: string | null,
) {
  await db
    .update(practiceSessions)
    .set({ workoutId, updatedAt: new Date() })
    .where(
      and(
        eq(practiceSessions.id, practiceSessionId),
        eq(practiceSessions.organizationId, organizationId),
      ),
    );
}

export async function getTrainingVolumeLastDays(
  organizationId: string,
  days = 7,
) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [row] = await db
    .select({
      totalDistance: sql<number>`coalesce(sum(${workouts.totalDistance}), 0)`,
      workoutCount: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .where(
      and(
        eq(workouts.organizationId, organizationId),
        gte(workouts.createdAt, since),
      ),
    );

  return {
    totalDistance: Number(row?.totalDistance ?? 0),
    workoutCount: Number(row?.workoutCount ?? 0),
    days,
  };
}
