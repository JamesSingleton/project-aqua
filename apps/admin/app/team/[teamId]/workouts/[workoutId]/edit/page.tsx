import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import { getWorkoutById } from "@project-aqua/db/queries/workouts";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toSharedDraftQuota } from "@/lib/draft-quota";
import { getWorkoutAction } from "../../actions";
import { WorkoutEditor } from "../../workout-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; workoutId: string }>;
}): Promise<Metadata> {
  const { teamId, workoutId } = await params;
  const workout = await getWorkoutById(workoutId, teamId);
  const title = workout?.title ?? "Workout";
  return {
    title: `Edit · ${title}`,
  };
}

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ teamId: string; workoutId: string }>;
}) {
  const { teamId, workoutId } = await params;
  const [workout, draftQuotaStatus] = await Promise.all([
    getWorkoutAction(teamId, workoutId),
    getAiQuotaStatus(teamId),
  ]);
  if (!workout) notFound();
  const draftQuota = toSharedDraftQuota(draftQuotaStatus);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold md:text-2xl">Edit workout</h1>
      <WorkoutEditor
        teamId={teamId}
        workoutId={workout.id}
        initialTitle={workout.title}
        initialRawText={workout.rawText}
        initialPracticeGroup={workout.practiceGroup ?? ""}
        initialDistanceUnit={workout.distanceUnit}
        draftQuota={draftQuota}
      />
    </div>
  );
}
