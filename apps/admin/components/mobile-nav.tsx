"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { PanelLeftIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@repo/ui/sheet";
import { Button } from "@repo/ui/button";
import { Icons } from "@repo/ui/icons";

import { NavItems } from "./left-nav";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  const { teamId } = params;
  const pathParts = pathname.split("/");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeftIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link href="/" onClick={() => setOpen(false)}>
            <Icons.logo className="h-8 w-auto" />
            <span className="sr-only">Acme Inc</span>
          </Link>
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
                className={`flex items-center gap-4 rounded-xl px-3 py-2 ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
