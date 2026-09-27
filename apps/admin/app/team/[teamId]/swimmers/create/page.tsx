import { getSession } from "@lane4hq/auth/session";
import { getOrganizationTeamType, requireTeamMember } from "@lane4hq/db/authz";
import { supportsClassYear } from "@lane4hq/swim-core/team-types";
import type { Metadata } from "next";
import CreateSwimmerForm from "./create-swimmer-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  return {
    title: "Add swimmer",
    alternates: { canonical: `/team/${teamId}/swimmers/create` },
  };
}

export default async function CreateSwimmerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);
  const teamType = await getOrganizationTeamType(teamId);

  return (
    <CreateSwimmerForm
      teamId={teamId}
      showClassYear={supportsClassYear(teamType)}
    />
  );
}
