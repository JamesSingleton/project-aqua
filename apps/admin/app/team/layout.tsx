import type { Metadata } from "next";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@project-aqua/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@project-aqua/ui/components/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@project-aqua/ui/components/breadcrumb";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3001"),
  title: {
    template: "%s | Project Aqua",
    default:
      "Swim Coach Dashboard: Roster, Upcoming Meets, and More | Project Aqua",
  },
  description:
    "Stay on top of your swim team's activities with Project Aqua's Swim Coach Dashboard. View your roster, track upcoming meets, and access other essential tools for effective team management.",
};

export default function AdminLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
      <div id="modal-root" />
    </SidebarProvider>
  );
}
