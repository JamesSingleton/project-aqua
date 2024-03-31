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

import { cn } from "@/lib/utils";
import { Badge } from "@repo/ui/badge";

export const NavItems = [
  { href: "", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/roster", icon: Users, label: "Roster" },
  { href: "/achievements", icon: Medal, label: "Achievements" },
  { href: "/analytics", icon: LineChart, label: "Analytics" },
  { href: "/workouts", icon: Waves, label: "Workouts" },
];

export default function LeftNav() {
  const pathname = usePathname();
  const params = useParams();
  const { teamId } = params;
  const pathParts = pathname.split("/");

  return (
    <div className="flex-1">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {NavItems.map(({ href, icon: Icon, label }) => {
          const hrefParts = href.split("/");
          const isActive =
            pathParts[1] === "admin" &&
            pathParts[2] === teamId &&
            pathParts[3] === hrefParts[1];

          return (
            <Link
              key={href}
              href={`/admin/${teamId}${href}`}
              className={cn(
                "flex items-center gap-4 rounded-xl px-3 py-2",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              {label === "Events" && (
                <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                  6
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
