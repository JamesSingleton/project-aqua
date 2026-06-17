import { db } from "@project-aqua/db/client";
import { organization } from "@project-aqua/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@project-aqua/ui/components/card";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, teamId))
    .limit(1);

  const metadata = org?.metadata ? JSON.parse(org.metadata) : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team settings</h1>
        <p className="text-muted-foreground">Manage your team profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{org?.name}</CardTitle>
          <CardDescription>Team ID: {teamId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Slug:</span> {org?.slug}
          </p>
          <p>
            <span className="text-muted-foreground">Type:</span>{" "}
            {metadata.teamType ?? "club"}
          </p>
          <p>
            <span className="text-muted-foreground">Plan:</span>{" "}
            {metadata.plan ?? "free"}
          </p>
          <p>
            <Link
              href={`/team/${teamId}/settings/safesport`}
              className="text-primary underline"
            >
              SafeSport & MAAPP settings
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
