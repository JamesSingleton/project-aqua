// app/team/[teamId]/roster/athletes/page.tsx

import { Button } from "@project-aqua/design-system/components/ui/button";
import { UploadIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { AthletesTable } from "@/components/roster/athletes-table";
import { MOCK_ATHLETES } from "@/lib/mock-data";

interface AthletesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function AthletesPage({ params }: AthletesPageProps) {
  const { teamId } = await params;

  // TODO: Replace with Supabase query
  const athletes = MOCK_ATHLETES;
  const groups = [...new Set(athletes.map((a) => a.group))].sort();

  const activeCount = athletes.filter((a) => a.active).length;

  return (
    <>
      <Header page="Athletes" pages={["Roster"]} />

      <div className="flex flex-col gap-6 p-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">Athletes</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {activeCount} active athlete{activeCount === 1 ? "" : "s"} on the
              roster
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/team/${teamId}/roster/import`}>
                <UploadIcon className="mr-1.5 h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/team/${teamId}/roster/athletes/new`}>
                <UserPlusIcon className="mr-1.5 h-4 w-4" />
                Add athlete
              </Link>
            </Button>
          </div>
        </div>

        <AthletesTable athletes={athletes} groups={groups} teamId={teamId} />
      </div>
    </>
  );
}
