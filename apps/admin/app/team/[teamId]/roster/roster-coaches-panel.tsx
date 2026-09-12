import { COACH_ROLES, type CoachRole } from "@project-aqua/auth/roles";
import { Badge } from "@project-aqua/ui/components/badge";
import { buttonVariants } from "@project-aqua/ui/components/button";
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

export type RosterCoach = {
  memberId: string;
  role: string;
  title: string | null;
  name: string;
  email: string;
};

function roleLabel(role: string) {
  return COACH_ROLES[role as CoachRole]?.label ?? role.replaceAll("_", " ");
}

export function RosterCoachesPanel({
  teamId,
  coaches,
  canManage,
}: {
  teamId: string;
  coaches: RosterCoach[];
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Coaches</CardTitle>
          <CardDescription>
            Coaching staff on this team. Team managers and other members are
            managed in Settings.
          </CardDescription>
        </div>
        {canManage ? (
          <Link
            href={`/team/${teamId}/settings/members`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Manage members
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {coaches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No coaches on this team yet.
            {canManage ? (
              <>
                {" "}
                <Link
                  href={`/team/${teamId}/settings/members`}
                  className="underline underline-offset-4"
                >
                  Invite someone
                </Link>{" "}
                with a coaching role.
              </>
            ) : null}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => (
                <TableRow key={coach.memberId}>
                  <TableCell className="font-medium">{coach.name}</TableCell>
                  <TableCell>{coach.email}</TableCell>
                  <TableCell>{coach.title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabel(coach.role)}</Badge>
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
