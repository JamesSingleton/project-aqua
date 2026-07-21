import type { Metadata } from "next";
import { redirect } from "next/navigation";

/** Legacy `/meets/import` URL — import lives on the meets page now. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Import meet",
    alternates: { canonical: `/team/${teamId}/meets` },
  };
}

export default async function MeetImportPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/team/${teamId}/meets`);
}
