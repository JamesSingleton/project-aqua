import { getAiQuotaStatus } from "@project-aqua/db/queries/ai-quota";
import type { Metadata } from "next";
import { toSharedDraftQuota } from "@/lib/draft-quota";
import { WorkoutEditor } from "../workout-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Create workout",
    alternates: { canonical: `/team/${teamId}/workouts/create` },
  };
}

export default async function CreateWorkoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ practiceSessionId?: string }>;
}) {
  const { teamId } = await params;
  const { practiceSessionId } = await searchParams;
  const draftQuota = toSharedDraftQuota(await getAiQuotaStatus(teamId));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold md:text-2xl">Create workout</h1>
      <WorkoutEditor
        teamId={teamId}
        practiceSessionId={practiceSessionId}
        draftQuota={draftQuota}
      />
    </div>
  );
}
