import { WorkoutEditor } from "../workout-editor";

export default async function CreateWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ practiceSessionId?: string }>;
}) {
  const { teamId } = await params;
  const { practiceSessionId } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold md:text-2xl">Create workout</h1>
      <WorkoutEditor teamId={teamId} practiceSessionId={practiceSessionId} />
    </div>
  );
}
