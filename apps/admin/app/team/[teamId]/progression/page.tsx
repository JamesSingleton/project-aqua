import { getRoster } from "@project-aqua/db/queries/roster";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { sortProgressionSwimmers } from "./progression-swimmers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Progression",
    description: "Browse swimmer time trends and meet history.",
    alternates: { canonical: `/team/${teamId}/progression` },
  };
}

export default async function ProgressionIndexPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const roster = await getRoster(teamId);
  const sorted = sortProgressionSwimmers(
    roster.map((s) => ({
      swimmerId: s.swimmerId,
      firstName: s.firstName,
      lastName: s.lastName,
      preferredName: s.preferredName,
      groupName: s.groupName,
    })),
  );

  if (sorted[0]) {
    redirect(`/team/${teamId}/progression/${sorted[0].swimmerId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progression"
        description="Select a swimmer to view time trends and meet history."
      />
      <p className="text-muted-foreground text-sm">
        Add swimmers to the roster to track progression.
      </p>
    </div>
  );
}
