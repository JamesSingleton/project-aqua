"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Waves } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NavItems } from "@/app/(admin)/LeftNav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const pathParts = pathname.split("/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <nav className="grid gap-2 text-lg font-medium">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-semibold"
            onClick={() => setOpen(false)}
          >
            <Waves className="h-6 w-6" />
            <span className="sr-only">Project Aqua</span>
          </Link>
          {NavItems.map(({ href, icon: Icon, label }) => {
            const hrefParts = href.split("/");
            const isActive =
              pathParts[1] === hrefParts[1] && pathParts[2] === hrefParts[2];

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setOpen(false)}
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
        <div className="mt-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>
                Unlock all features and get unlimited access to our support
                team.
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
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
