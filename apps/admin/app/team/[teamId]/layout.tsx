import { getSession } from "@project-aqua/auth/session";
import { getUserTeams, requireTeamMember } from "@project-aqua/db/authz";
import { getTeamPlan } from "@project-aqua/db/queries/billing";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@project-aqua/ui/components/breadcrumb";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@project-aqua/ui/components/sidebar";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

export default async function TeamIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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

  const userTeams = await getUserTeams(session.user.id);
  const teamsWithPlans = await Promise.all(
    userTeams.map(async (team) => ({
      id: team.id,
      name: team.name,
      plan: await getTeamPlan(team.id),
    })),
  );

  return (
    <SidebarProvider>
      <AppSidebar teamId={teamId} teams={teamsWithPlans} user={session.user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/team/${teamId}`}>
                    Project Aqua
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Team</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
