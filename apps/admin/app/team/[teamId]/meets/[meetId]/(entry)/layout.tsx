import { MeetEntryNav } from "../meet-entry-nav";

export default async function MeetEntryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <MeetEntryNav teamId={teamId} meetId={meetId} />
      <div className="mt-2">{children}</div>
    </div>
  );
}
