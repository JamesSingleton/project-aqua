import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireTeamMember,
} from "@project-aqua/db/authz";
import { supportsClassYear } from "@project-aqua/swim-core/team-types";
import CreateSwimmerForm from "./create-swimmer-form";

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
