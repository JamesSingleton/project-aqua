import { getSession } from "@project-aqua/auth/session";
import { getMember, requireTeamMember } from "@project-aqua/db/authz";
import {
  getTeamInvitations,
  getTeamMembers,
} from "@project-aqua/db/queries/members";
import { SettingsSection } from "../settings-section";
import { MembersPanel } from "./members-panel";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  await requireTeamMember(session?.user?.id, teamId);

  const [members, invitations, membership] = await Promise.all([
    getTeamMembers(teamId),
    getTeamInvitations(teamId),
    session?.user?.id
      ? getMember(session.user.id, teamId)
      : Promise.resolve(null),
  ]);

  const canManage =
    membership?.role === "owner" ||
    membership?.role === "head_coach" ||
    membership?.role === "admin";

  return (
    <SettingsSection
      title="Members"
      description="Invite and manage people with access to this team — coaches, managers, and other staff."
    >
      <MembersPanel
        teamId={teamId}
        members={members}
        invitations={invitations}
        canManage={canManage}
        currentUserId={session?.user?.id ?? ""}
      />
    </SettingsSection>
  );
}
