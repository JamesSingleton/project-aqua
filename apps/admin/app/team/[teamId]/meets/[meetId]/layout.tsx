import { formatDateOnlyLabel } from "@project-aqua/swim-core/calendar-date";
import { getMeetById } from "@project-aqua/db/queries/meets";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SetBreadcrumbEntity } from "@/components/breadcrumb-entities";
import { PageHeader } from "@/components/page-header";
import { DeleteMeetButton } from "../delete-meet-button";
import { MeetImportButton } from "../meet-import-button";
import { MeetExportButtons } from "./meet-export-buttons";
import { MeetHeaderLinks } from "./meet-header-links";

export default async function MeetDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const meet = await getMeetById(meetId, teamId);
  if (!meet) notFound();

  const endLabel = meet.endDate
    ? ` – ${formatDateOnlyLabel(meet.endDate)}`
    : "";
  const deadlineLabel = meet.entryDeadline
    ? ` · Entries due ${formatDateOnlyLabel(meet.entryDeadline)}`
    : "";
  const description = `${formatDateOnlyLabel(meet.startDate)}${endLabel} · ${meet.course}${deadlineLabel}${meet.location ? ` · ${meet.location}` : ""}${meet.address ? ` · ${meet.address}` : ""}`;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <SetBreadcrumbEntity id={meetId} label={meet.name} />
      <div className="text-muted-foreground text-sm">
        <Link
          href={`/team/${teamId}/meets`}
          className="hover:text-foreground underline-offset-4 hover:underline"
        >
          Meets
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{meet.name}</span>
      </div>

      <PageHeader
        title={meet.name}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MeetHeaderLinks teamId={teamId} meetId={meetId} />
            <MeetImportButton
              teamId={teamId}
              defaultMeetId={meetId}
              meets={[
                {
                  id: meet.id,
                  name: meet.name,
                  startDateLabel: formatDateOnlyLabel(meet.startDate),
                },
              ]}
              triggerLabel="Import file"
            />
            <MeetExportButtons
              teamId={teamId}
              meetId={meetId}
              meetName={meet.name}
            />
            <DeleteMeetButton
              teamId={teamId}
              meetId={meetId}
              meetName={meet.name}
            />
          </div>
        }
      />

      {children}
    </div>
  );
}
