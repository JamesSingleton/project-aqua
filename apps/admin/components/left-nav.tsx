"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Calendar,
  LayoutDashboard,
  LineChart,
  Medal,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  Users2,
  Waves,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@repo/ui/tooltip";

import { cn } from "@/lib/utils";

export const NavItems = [
  { href: "", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "Events" },
  // { href: "/teams", icon: Users, label: "Teams" },
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
    <>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href={`/admin/${teamId}`}
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        {NavItems.map(({ href, icon: Icon, label }) => {
          const hrefParts = href.split("/");
          const isActive =
            pathParts[1] === "admin" &&
            pathParts[2] === teamId &&
            pathParts[3] === hrefParts[1];

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={`/admin/${teamId}${href}`}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    isActive && "bg-accent",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="#"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </nav>
    </>
  );
}
