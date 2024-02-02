import {
  BellIcon,
  HomeIcon,
  WavesIcon,
  UsersIcon,
  CalendarSearchIcon,
  LineChartIcon,
  LayoutDashboardIcon,
} from "lucide-react";
import Link from "next/link";

// import { Button, buttonVariants } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// import { Badge } from "@/components/ui/badge";
import Image from "next/image";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardDescription,
//   CardContent,
// } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link
              className="flex items-center gap-2 font-semibold"
              href="/admin"
            >
              <WavesIcon className="h-6 w-6" />
              Swim Tech
            </Link>
            {/* <Button className="ml-auto h-8 w-8" size="icon" variant="outline">
              <BellIcon className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button> */}
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="/admin"
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="/admin/teams"
              >
                <UsersIcon className="h-4 w-4" />
                Teams
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="/admin/events"
              >
                <CalendarSearchIcon className="h-4 w-4" />
                Events
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
                href="/admin/analytics"
              >
                <LineChartIcon className="h-4 w-4" />
                Analytics
              </Link>
            </nav>
          </div>
          <div className="mt-auto p-4">
            {/* <Card>
              <CardHeader className="pb-4">
                <CardTitle>Upgrade to Pro</CardTitle>
                <CardDescription>
                  Unlock all features and get unlimited access to our support
                  team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/admin/settings/billing"
                  className={cn(buttonVariants({ size: "sm" }), "w-full")}
                >
                  Upgrade
                </Link>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-gray-100/40 px-6 lg:h-[60px] dark:bg-gray-800/40">
          <Link className="lg:hidden" href="/admin">
            <HomeIcon className="h-6 w-6" />
            <span className="sr-only">Home</span>
          </Link>

          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="ml-auto h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800"
                size="icon"
                variant="ghost"
              >
                <Image
                  alt="Avatar"
                  className="h-8 w-8 rounded-full object-cover"
                  height="32"
                  src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGF2YXRhciUyMGJlYXJkfGVufDB8fDB8fHww"
                  width="32"
                />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/admin/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
