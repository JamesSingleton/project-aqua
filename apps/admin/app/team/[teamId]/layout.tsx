import { getSession } from "@lane4hq/auth/session";
import {
  getMember,
  getOrganizationName,
  getOrganizationTeamType,
  getTeamCapabilities,
  getUserTeams,
  requireTeamMember,
} from "@lane4hq/db/authz";
import { getTeamPlans } from "@lane4hq/db/queries/billing";
import { Separator } from "@lane4hq/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@lane4hq/ui/components/sidebar";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbEntitiesProvider } from "@/components/breadcrumb-entities";
import { TeamBreadcrumb } from "@/components/team-breadcrumb";
import { TeamCapabilitiesProvider } from "@/components/team-capabilities";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const session = await getSession();
  if (!session?.user) {
    return { title: "Team" };
  }
  const name = (await getOrganizationName(teamId)) ?? "Team";
  return {
    title: {
      default: name,
      template: `%s | ${name}`,
    },
  };
}

export default async function TeamIdLayout({
  children,
  modal,
  params,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  try {
    await requireTeamMember(session.user.id, teamId);
  } catch {
    redirect("/onboarding");
  }

  const [userTeams, teamType] = await Promise.all([
    getUserTeams(session.user.id),
    getOrganizationTeamType(teamId),
  ]);
  const plans = await getTeamPlans(userTeams.map((team) => team.id));
  const teamsWithPlans = userTeams.map((team) => ({
    id: team.id,
    name: team.name,
    plan: plans.get(team.id) ?? "free",
    role: team.role,
    logo: team.logo,
  }));
  const teamName =
    teamsWithPlans.find((team) => team.id === teamId)?.name ?? "Team";
  const member = await getMember(session.user.id, teamId);
  const capabilities = getTeamCapabilities(member?.role);

  return (
    <TeamCapabilitiesProvider capabilities={capabilities}>
      <SidebarProvider>
        <BreadcrumbEntitiesProvider>
          <AppSidebar
            teamId={teamId}
            teamType={teamType}
            teams={teamsWithPlans}
            user={session.user}
          />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <TeamBreadcrumb teamId={teamId} teamName={teamName} />
              </div>
            </header>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
            {modal}
          </SidebarInset>
        </BreadcrumbEntitiesProvider>
      </SidebarProvider>
    </TeamCapabilitiesProvider>
  );
}
