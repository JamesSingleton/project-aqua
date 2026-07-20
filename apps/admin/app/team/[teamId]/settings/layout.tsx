import { getOrganizationTeamType } from "@project-aqua/db/authz";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const teamType = await getOrganizationTeamType(teamId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your team, members, billing, and account."
      />
      <SettingsNav teamId={teamId} teamType={teamType} />
      <div className="mt-2">{children}</div>
    </div>
  );
}
