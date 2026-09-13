import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CreateMeetForm } from "./create-meet-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Add meet",
    alternates: { canonical: `/team/${teamId}/meets/create` },
  };
}

export default async function CreateMeetPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add meet"
        description="Set up a meet for entries and RSVPs. Import an event file anytime to load events."
      />
      <CreateMeetForm teamId={teamId} />
    </div>
  );
}
