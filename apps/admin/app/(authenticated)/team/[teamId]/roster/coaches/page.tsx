import { Button } from "@project-aqua/design-system/components/ui/button";
import { AlertCircleIcon, ClockIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/header";
import { CoachesTable } from "@/components/roster/coaches-table";
import { MOCK_COACHES } from "@/lib/mock-data";

interface CoachesPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function CoachesPage({ params }: CoachesPageProps) {
  const { teamId } = await params;

  // TODO: Replace with Supabase query
  const coaches = MOCK_COACHES;

  const expiredCerts = coaches.filter((c) => c.certStatus === "expired");
  const expiringSoon = coaches.filter((c) => c.certStatus === "expiring_soon");

  return (
    <>
      <Header page="Coaches" pages={["Roster"]} />

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Coaches &amp; staff
            </h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {coaches.length} staff member{coaches.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href={`/team/${teamId}/roster/coaches/new`}>
              <UserPlusIcon className="mr-1.5 h-4 w-4" />
              Add coach
            </Link>
          </Button>
        </div>

        {/* Cert alerts */}
        {expiredCerts.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">
                {expiredCerts.length} coach
                {expiredCerts.length === 1 ? " has" : "es have"} an expired USA
                Swimming certification
              </p>
              <p className="mt-0.5 text-destructive/80 text-xs">
                {expiredCerts.map((c) => c.displayName).join(", ")}
              </p>
            </div>
          </div>
        )}

        {expiringSoon.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-800/40 dark:bg-yellow-900/10">
            <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                {expiringSoon.length} certification
                {expiringSoon.length === 1 ? " expires" : "s expire"} soon
              </p>
              <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                {expiringSoon.map((c) => c.displayName).join(", ")}
              </p>
            </div>
          </div>
        )}

        <CoachesTable coaches={coaches} teamId={teamId} />
      </div>
    </>
  );
}
