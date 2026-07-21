import { getWorkoutById } from "@project-aqua/db/queries/workouts";
import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkoutAction } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; workoutId: string }>;
}): Promise<Metadata> {
  const { teamId, workoutId } = await params;
  const workout = await getWorkoutById(workoutId, teamId);
  return {
    title: workout?.title ?? "Workout",
  };
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; workoutId: string }>;
}) {
  const { teamId, workoutId } = await params;
  const workout = await getWorkoutAction(teamId, workoutId);
  if (!workout) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">{workout.title}</h1>
          <p className="text-muted-foreground text-sm">
            {workout.totalDistance ?? 0}
            {workout.distanceUnit ? ` ${workout.distanceUnit}` : ""} total ·{" "}
            {workout.sets.length} sets
            {workout.wasAiGenerated ? " · AI-assisted" : ""}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/team/${teamId}/workouts/${workoutId}/edit`} />}
        >
          Edit
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Raw text</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {workout.rawText}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sets</CardTitle>
            <CardDescription>Structured for analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {workout.sets.map((set) => (
                <li key={set.id} className="rounded border px-3 py-2">
                  <div className="font-medium">
                    {set.reps}×{set.distance} {set.stroke}
                    {set.interval ? ` @ ${set.interval}` : ""}
                  </div>
                  {set.section && (
                    <div className="text-muted-foreground text-xs capitalize">
                      {set.section}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
