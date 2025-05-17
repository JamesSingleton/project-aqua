import type { Metadata } from "next";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/app-sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Search } from "@/components/search";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ProfileDropdown } from "@/components/profile-dropdown";

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
        <Header>
          <div className="ml-auto flex items-center gap-4">
            <Search />
            <ThemeSwitcher />
            <ProfileDropdown />
          </div>
        </Header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
      <div id="modal-root" />
    </SidebarProvider>
  );
}
