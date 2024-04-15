"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "@repo/ui/navigation-menu";

import { cn } from "@/lib/utils";
import { Icons } from "./icons";

const links = [
  {
    title: "Pricing",
    path: "/pricing",
    name: "pricing",
  },
  {
    title: "Updates",
    path: "/updates",
    name: "updates",
  },
  {
    title: "Story",
    path: "/story",
    name: "story",
  },
  {
    title: "Download",
    path: "/download",
    name: "download",
  },
];

const Header = () => {
  const pathname = usePathname();
  const lastPath = `/${pathname.split("/").pop()}`;
  return (
    <header className="h-12 sticky mt-4 top-4 z-50 px-2 md:px-4 md:flex justify-center">
      <nav className="border border-border p-3 rounded-2xl flex items-center backdrop-filter backdrop-blur-xl bg-[#FDFDFC] dark:bg-[#121212] bg-opacity-70">
        <NavigationMenu>
          <Link href="/">
            <span className="sr-only">Project Aqua Logo</span>
            <Icons.logo className="h-8 w-8" />
          </Link>
          <ul className="space-x-2 font-medium text-sm hidden md:flex mx-3">
            {links.map(({ path, name, title }) => {
              const isActive =
                path === "/updates"
                  ? pathname.includes("updates")
                  : path === lastPath;

              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={cn(
                      "h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 inline-flex text-secondary-foreground hover:bg-secondary",
                      isActive && "bg-secondary hover:bg-secondary",
                    )}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </NavigationMenu>
        <Link
          href="https://project-aqua-admin.vercel.app"
          className="hidden md:inline-flex h-8 items-center justify-center rounded-md text-sm font-medium transition-colors px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </Link>
      </nav>
    </header>
  );
};

export default Header;
