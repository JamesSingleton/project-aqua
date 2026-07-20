import { getMeets } from "@project-aqua/db/queries/meets";
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
import { CreateMeetForm } from "../create-meet-form";
import { DeleteMeetButton } from "../delete-meet-button";
import { MeetImportButton } from "../meet-import-button";

export const metadata: Metadata = {
  title: "Meets",
  description:
    "Import event files or results, then build entries and export HY3.",
};

export default async function MeetsEntriesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const meets = await getMeets(teamId);

  const meetOptions = meets.map((meet) => ({
    id: meet.id,
    name: meet.name,
    startDateLabel: meet.startDate.toLocaleDateString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <MeetImportButton
          teamId={teamId}
          meets={meetOptions}
          triggerLabel="Import meet file"
          triggerVariant="default"
          triggerSize="default"
        />
      </div>

      <CreateMeetForm teamId={teamId} />

      <Card>
        <CardHeader>
          <CardTitle>All meets</CardTitle>
          <CardDescription>{meets.length} meets</CardDescription>
        </CardHeader>
        <CardContent>
          {meets.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No meets yet. Import a meet file or create one manually.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meets.map((meet) => (
                  <TableRow key={meet.id}>
                    <TableCell>
                      <Link
                        href={`/team/${teamId}/meets/${meet.id}`}
                        className="text-primary underline"
                      >
                        {meet.name}
                      </Link>
                    </TableCell>
                    <TableCell>{meet.startDate.toLocaleDateString()}</TableCell>
                    <TableCell>{meet.course}</TableCell>
                    <TableCell>{meet.location ?? "—"}</TableCell>
                    <TableCell>
                      <DeleteMeetButton
                        teamId={teamId}
                        meetId={meet.id}
                        meetName={meet.name}
                        variant="ghost"
                      />
                    </TableCell>
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
