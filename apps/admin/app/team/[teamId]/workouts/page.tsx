import { Button } from "@project-aqua/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@project-aqua/ui/components/table";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listWorkoutsAction } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Workouts",
    description: "Practice workouts and training volume.",
    alternates: { canonical: `/team/${teamId}/workouts` },
  };
}

export default async function WorkoutsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const workouts = await listWorkoutsAction(teamId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workouts"
        description="Write practices in coach notation. Suggest with AI using times and attendance."
        actions={
          <Button
            nativeButton={false}
            render={<Link href={`/team/${teamId}/workouts/create`} />}
          >
            New workout
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Team library</CardTitle>
          <CardDescription>{workouts.length} workouts</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No workouts yet. Create one or ask AI to suggest a practice.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell>
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={`/team/${teamId}/workouts/${w.id}`}
                      >
                        {w.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {w.totalDistance != null
                        ? `${w.totalDistance.toLocaleString()}${
                            w.distanceUnit === "meters"
                              ? " m"
                              : w.distanceUnit === "yards"
                                ? " yd"
                                : ""
                          }`
                        : "—"}
                    </TableCell>
                    <TableCell>{w.wasAiGenerated ? "Yes" : "—"}</TableCell>
                    <TableCell>{w.createdAt.toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
