"use client";

import { Button } from "@project-aqua/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@project-aqua/ui/components/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@project-aqua/ui/components/sheet";
import { cn } from "@project-aqua/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { CtaLink } from "@/components/cta-link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  audienceLinks,
  PRIMARY_CTA,
  productLinks,
  SIGN_IN_URL,
  SIGN_UP_URL,
  SITE_TAGLINE,
} from "@/lib/site";

const topLinks = [
  { href: "/pricing", title: "Pricing" },
  { href: "/formats", title: "Formats" },
  { href: "/story", title: "Story" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-3 z-40 px-3 pt-[env(safe-area-inset-top)] md:px-4">
      <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-2xl bg-background/80 p-1 ring-1 ring-foreground/10 backdrop-blur-xl">
        <Link
          href="/"
          aria-label="Project Aqua home"
          className="press-scale flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium"
        >
          <BrandLogo />
          <span className="hidden sm:inline">Project Aqua</span>
        </Link>

        <NavigationMenu className="hidden flex-1 md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent className="w-[min(36rem,calc(100vw-2rem))] p-2">
                <ul className="grid gap-1 sm:grid-cols-2">
                  {productLinks.map((item) => (
                    <li key={item.href}>
                      <NavigationMenuLink
                        render={<Link href={item.href} />}
                        className="flex flex-col items-start gap-0.5"
                      >
                        <span className="font-medium">{item.title}</span>
                        <span className="text-muted-foreground text-sm">
                          {item.description}
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            {topLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <NavigationMenuLink
                  render={<Link href={link.href} />}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActivePath(pathname, link.href) && "bg-muted",
                  )}
                >
                  {link.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <CtaLink
            href={SIGN_IN_URL}
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
          >
            Sign in
          </CtaLink>
          <CtaLink
            href={SIGN_UP_URL}
            size="sm"
            className="hidden rounded-full md:inline-flex"
          >
            {PRIMARY_CTA}
          </CtaLink>
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="press-scale md:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(20rem,100%)] overscroll-contain"
            >
              <SheetHeader>
                <SheetTitle>Project Aqua</SheetTitle>
                <SheetDescription>{SITE_TAGLINE}</SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile"
                className="flex flex-col gap-6 px-4 pb-8"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-sm">Product</p>
                  {productLinks.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          className="rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                        />
                      }
                      nativeButton={false}
                    >
                      {item.title}
                    </SheetClose>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-sm">Teams</p>
                  {audienceLinks.map((item) => (
                    <SheetClose
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          className="rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                        />
                      }
                      nativeButton={false}
                    >
                      {item.title}
                    </SheetClose>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {topLinks.map((link) => (
                    <SheetClose
                      key={link.href}
                      render={
                        <Link
                          href={link.href}
                          className="rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                        />
                      }
                      nativeButton={false}
                    >
                      {link.title}
                    </SheetClose>
                  ))}
                  <SheetClose
                    render={
                      <Link
                        href="/support"
                        className="rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                      />
                    }
                    nativeButton={false}
                  >
                    Support
                  </SheetClose>
                </div>
                <div className="flex flex-col gap-2">
                  <CtaLink
                    href={SIGN_IN_URL}
                    variant="outline"
                    className="w-full"
                  >
                    Sign in
                  </CtaLink>
                  <CtaLink href={SIGN_UP_URL} className="w-full">
                    {PRIMARY_CTA}
                  </CtaLink>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
