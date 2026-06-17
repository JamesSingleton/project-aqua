import { getMeets } from "@project-aqua/db/queries/meets";
import { Button, buttonVariants } from "@project-aqua/ui/components/button";
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
import Link from "next/link";

export default async function MeetsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const meets = await getMeets(teamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meets</h1>
          <p className="text-muted-foreground">Manage swim meets and lineups</p>
        </div>
        <Link
          href={`/team/${teamId}/meets/import`}
          className={buttonVariants()}
        >
          Import meet
        </Link>
      </div>

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
