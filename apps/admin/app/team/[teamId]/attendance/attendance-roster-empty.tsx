import { Button } from "@project-aqua/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@project-aqua/ui/components/empty";
import { UsersRound } from "lucide-react";
import Link from "next/link";

export function AttendanceRosterEmpty({ teamId }: { teamId: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UsersRound aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Add swimmers to take roll</EmptyTitle>
        <EmptyDescription>
          Roll call needs a roster first. Add your swimmers, then return here to
          open a roll for each practice.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          nativeButton={false}
          render={<Link href={`/team/${teamId}/roster`} />}
        >
          Go to roster
        </Button>
      </EmptyContent>
    </Empty>
  );
}
