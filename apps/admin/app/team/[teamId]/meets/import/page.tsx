import { redirect } from "next/navigation";

/** Legacy `/meets/import` URL — import lives on the meets page now. */
export default async function MeetImportPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/team/${teamId}/meets`);
}
