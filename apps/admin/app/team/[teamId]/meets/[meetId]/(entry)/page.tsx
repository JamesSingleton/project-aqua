import { formatDateOnlyLabel } from "@project-aqua/swim-core/calendar-date";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMeetDetailAction } from "../../actions";
import { MeetInfoForm } from "../meet-info-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}): Promise<Metadata> {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) return {};
  return {
    title: `${detail.meet.name} - Meet`,
    description: `${formatDateOnlyLabel(detail.meet.startDate)} · ${detail.meet.course}`,
  };
}

export default async function MeetInformationPage({
  params,
}: {
  params: Promise<{ teamId: string; meetId: string }>;
}) {
  const { teamId, meetId } = await params;
  const detail = await getMeetDetailAction(teamId, meetId);
  if (!detail) notFound();

  const { meet } = detail;

  return (
    <MeetInfoForm
      teamId={teamId}
      meetId={meetId}
      meet={{
        name: meet.name,
        startDate: meet.startDate,
        endDate: meet.endDate,
        entryDeadline: meet.entryDeadline,
        course: meet.course,
        location: meet.location,
        address: meet.address,
        importSource: meet.importSource,
        maxIndividualEntries: meet.maxIndividualEntries,
        maxRelayEntries: meet.maxRelayEntries,
        maxCombinedEntries: meet.maxCombinedEntries,
        entryLimitPackages: meet.entryLimitPackages,
        entryLimitsSource: meet.entryLimitsSource,
      }}
    />
  );
}
