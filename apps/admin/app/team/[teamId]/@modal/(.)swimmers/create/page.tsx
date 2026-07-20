import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationTeamType,
  requireTeamMember,
} from "@project-aqua/db/authz";
import { supportsClassYear } from "@project-aqua/swim-core/team-types";
import CreateSwimmerForm from "@/app/team/[teamId]/swimmers/create/create-swimmer-form";
import { Modal } from "./modal";

export default async function CreateSwimmerModal({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);
  const teamType = await getOrganizationTeamType(teamId);

  return (
    <Modal>
      <CreateSwimmerForm
        teamId={teamId}
        variant="modal"
        showClassYear={supportsClassYear(teamType)}
      />
    </Modal>
  );
}
