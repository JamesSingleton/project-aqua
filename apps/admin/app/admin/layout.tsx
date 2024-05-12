import Link from "next/link";
import { CircleUser, Bell } from "lucide-react";
import LeftNav from "@/components/left-nav";
import { Button } from "@repo/ui/button";
import { Icons } from "@repo/ui/icons";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@repo/ui/dropdown-menu";
import MobileNav from "@/components/mobile-nav";

import type { Metadata } from "next";

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
  createAthleteModal,
}: Readonly<{
  children: React.ReactNode;
  createAthleteModal: React.ReactNode;
}>) {
  return (
    <>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-muted/40">
        <aside className="hidden border-r bg-background md:block sticky top-0 h-screen overflow-auto">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-2 font-semibold h-14 border-b px-4 lg:h-[60px] lg:px-6"
            >
              <Icons.logo className="h-8 w-auto" />
            </Link>
            <LeftNav />
          </div>
        </aside>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <MobileNav />
            <div className="ml-auto flex gap-4 items-center">
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    <CircleUser className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 sm:py-0">
            {children}
            {createAthleteModal}
          </main>
        </div>
      </div>
      <div id="modal-root" />
    </>
  );
}
