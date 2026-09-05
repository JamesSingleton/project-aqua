import { getSession } from "@project-aqua/auth/session";
import {
  getOrganizationName,
  getOrganizationTeamType,
  getUserTeams,
  requireTeamMember,
} from "@project-aqua/db/authz";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@project-aqua/ui/components/sidebar";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbEntitiesProvider } from "@/components/breadcrumb-entities";
import { TeamBreadcrumb } from "@/components/team-breadcrumb";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
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
  const teamsWithPlans = await Promise.all(
    userTeams.map(async (team) => ({
      id: team.id,
      name: team.name,
      plan: await getTeamPlan(team.id),
      role: team.role,
      logo: team.logo,
    })),
  );
  const teamName =
    teamsWithPlans.find((team) => team.id === teamId)?.name ?? "Team";

  return (
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
  );
}
