import { getMeets } from "@project-aqua/db/queries/meets";
import type { Metadata } from "next";
import type { MeetTableRow } from "@/components/meets/meets-columns";
import { MeetsTable } from "@/components/meets/meets-table";
import { MeetImportButton } from "../meet-import-button";

export const metadata: Metadata = {
  title: "Meets",
  description:
    "Import event files or results, then build entries and export HY3.",
};

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function MeetsEntriesPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const meets = await getMeets(teamId);

  const meetOptions = meets.map((meet) => ({
    id: meet.id,
    name: meet.name,
    startDateLabel: meet.startDate.toLocaleDateString(),
  }));

  const rows: MeetTableRow[] = meets.map((meet) => ({
    id: meet.id,
    name: meet.name,
    startDate: toLocalIsoDate(meet.startDate),
    course: meet.course,
    location: meet.location,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <MeetImportButton
          teamId={teamId}
          meets={meetOptions}
          triggerLabel="Import meet file"
          triggerVariant="default"
          triggerSize="default"
        />
      </div>

      <MeetsTable teamId={teamId} meets={rows} />
    </div>
  );
}
