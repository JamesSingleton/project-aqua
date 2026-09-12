import { PageHeader } from "@/components/page-header";
import { MeetTopNav } from "../meet-top-nav";

export default async function MeetsHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meets"
        description="Import event files or results, then build entries and export HY3."
      />
      <MeetTopNav teamId={teamId} />
      <div className="mt-2">{children}</div>
    </div>
  );
}
