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
import { UsaSwimmingSettings } from "./usa-swimming-settings";

export default async function UsaSwimmingPage({
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
        <h1 className="text-3xl font-bold tracking-tight">USA Swimming</h1>
        <p className="text-muted-foreground">
          Connect your team to USA Swimming SWIMS
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SWIMS integration</CardTitle>
          <CardDescription>
            Sync rosters and registration data with USA Swimming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsaSwimmingSettings
            teamId={teamId}
            connectedClubId={metadata.usaSwimmingClubId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
