"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LineChart,
  LayoutDashboard,
  Calendar,
  Medal,
  Waves,
  Users,
} from "lucide-react";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
  CardFooter,
} from "@repo/ui/card";
import { Button, buttonVariants } from "@repo/ui/button";

import { cn } from "@/lib/utils";
import { TeamSwitcher } from "./team-switcher";
import { Separator } from "@repo/ui/separator";
import { mockTeams } from "@/lib/mock-data";

export const NavItems = [
  { href: "", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/meets", icon: Calendar, label: "Meets" },
  { href: "/roster", icon: Users, label: "Roster" },
  // { href: "/achievements", icon: Medal, label: "Achievements" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
  { href: "/workouts", icon: Waves, label: "Workouts" },
];

export default function LeftNav() {
  const pathname = usePathname();
  const params = useParams();
  const { teamId } = params;
  const pathParts = pathname.split("/");

  return (
    <>
      <div className="flex-1">
        <div className="flex h-[52px] items-center justify-center px-2 pb-2">
          <TeamSwitcher isCollapsed={false} teams={mockTeams} />
        </div>
        <Separator />
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 pt-2">
          {NavItems.map(({ href, icon: Icon, label }) => {
            const hrefParts = href.split("/");
            const isActive =
              pathParts[1] === "admin" &&
              pathParts[2] === teamId &&
              pathParts[3] === hrefParts[1];
            const className = cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              {
                "text-primary bg-muted": isActive,
              },
            );
            return (
              <Link
                className={className}
                key={href}
                href={`/admin/${teamId}${href}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Card>
          <CardHeader className="p-2 pt-0 md:p-4">
            <CardTitle>Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock all features and get unlimited access to our support team.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
            <Link
              className={cn(buttonVariants({ size: "sm" }), "w-full")}
              href="#"
            >
              Upgrade
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
