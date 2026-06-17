import MeetImportClient from "./import-client";

export default async function MeetImportPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  return <MeetImportClient teamId={teamId} />;
}
