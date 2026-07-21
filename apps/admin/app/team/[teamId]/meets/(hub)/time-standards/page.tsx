import type { Metadata } from "next";
import {
  getTimeStandardCutsAction,
  listTimeStandardEventsAction,
  listTimeStandardSetsAction,
} from "../../time-standards-actions";
import { TimeStandardsManager } from "./time-standards-manager";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Time Standards",
    description: "Manage cut times for meet results comparison.",
    alternates: { canonical: `/team/${teamId}/meets/time-standards` },
  };
}

export default async function TimeStandardsPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ set?: string }>;
}) {
  const { teamId } = await params;
  const { set: setParam } = await searchParams;
  const [sets, events] = await Promise.all([
    listTimeStandardSetsAction(teamId),
    listTimeStandardEventsAction(teamId),
  ]);

  const selectedSetId =
    setParam && sets.some((set) => set.id === setParam) ? setParam : null;

  const cuts =
    selectedSetId != null
      ? (await getTimeStandardCutsAction(teamId, selectedSetId)).cuts
      : [];

  return (
    <TimeStandardsManager
      teamId={teamId}
      selectedSetId={selectedSetId}
      sets={sets.map((s) => ({
        id: s.id,
        name: s.name,
        course: s.course,
        seasonLabel: s.seasonLabel,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        cutCount: s.cutCount,
      }))}
      cuts={cuts}
      events={events}
    />
  );
}
