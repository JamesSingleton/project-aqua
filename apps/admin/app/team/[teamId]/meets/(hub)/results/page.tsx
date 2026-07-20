import { getMeetsWithResultStats } from "@project-aqua/db/queries/meets";
import { Badge } from "@project-aqua/ui/components/badge";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meet results",
  description: "Review times imported or entered for each meet.",
};

export default async function MeetsResultsHubPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const meets = await getMeetsWithResultStats(teamId);
  const withResults = meets.filter((m) => m.resultCount > 0);

  return (
    <div className="flex flex-col gap-4">
      {withResults.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No meet results yet. Import a results file or add times from a meet.
        </p>
      ) : (
        <ul className="divide-border divide-y rounded-lg border">
          {withResults.map((meet) => {
            const endLabel = meet.endDate
              ? ` – ${meet.endDate.toLocaleDateString()}`
              : "";
            return (
              <li key={meet.id}>
                <Link
                  href={`/team/${teamId}/meets/${meet.id}/results`}
                  className="hover:bg-muted/40 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{meet.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {meet.startDate.toLocaleDateString()}
                      {endLabel}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {meet.athleteCount}{" "}
                    {meet.athleteCount === 1 ? "athlete" : "athletes"}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {meet.resultCount}{" "}
                    {meet.resultCount === 1 ? "result" : "results"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
