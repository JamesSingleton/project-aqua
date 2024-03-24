"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LineChart, Users, Calendar, Medal, Waves } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const NavItems = [
  { href: "/admin", icon: Home, label: "Dashboard" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
  { href: "/admin/teams", icon: Users, label: "Teams" },
  { href: "/admin/achievements", icon: Medal, label: "Achievements" },
  { href: "/admin/analytics", icon: LineChart, label: "Analytics" },
  { href: "/admin/workouts", icon: Waves, label: "Workouts" },
];

export default function LeftNav() {
  const pathname = usePathname();
  const pathParts = pathname.split("/");

  return (
    <div className="flex-1">
      <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {NavItems.map(({ href, icon: Icon, label }) => {
          const hrefParts = href.split("/");
          const isActive =
            pathParts[1] === hrefParts[1] && pathParts[2] === hrefParts[2];

          return (
            <Link
              key={href}
              href={href}
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
