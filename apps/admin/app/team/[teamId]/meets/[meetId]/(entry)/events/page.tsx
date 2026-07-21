import {
  formatEventName,
  formatGenderLabel,
} from "@project-aqua/swim-core/events";
import { formatTime } from "@project-aqua/swim-core/times";
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
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return { title: `${detail.meet.name} - Events` };
}

export default async function MeetEventsPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { events } = detail;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          {events.length} events from the meet file
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No events yet. Import a meet events file to load the event list.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age group</TableHead>
                <TableHead className="text-right">Qualifying time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.eventNumber ?? "—"}</TableCell>
                  <TableCell>
                    {formatEventName(event.distance, event.stroke)}
                  </TableCell>
                  <TableCell>{formatGenderLabel(event.gender)}</TableCell>
                  <TableCell>{event.ageGroup ?? "—"}</TableCell>
                  <TableCell className="font-timing text-right tabular-nums">
                    {event.qualifyingTimeMs != null &&
                    event.qualifyingTimeMs > 0
                      ? formatTime(event.qualifyingTimeMs)
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
