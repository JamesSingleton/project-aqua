"use client";
import { NavigationMenu } from "@project-aqua/design-system/components/navigation-menu";
import { cn } from "@project-aqua/design-system/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

const itemVariant = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const listVariant = {
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
  hidden: {
    opacity: 0,
  },
};

const Header = () => {
  const [isOpen, setOpen] = useState(false);
  const pathname = usePathname();
  const lastPath = `/${pathname.split("/").pop()}`;

  const handleToggleMenu = () => {
    setOpen((prev) => {
      document.body.style.overflow = prev ? "" : "hidden";
      return !prev;
    });
  };

  return (
    <header className="sticky top-4 z-50 mt-4 h-12 justify-center px-2 md:flex md:px-4">
      <nav className="flex items-center rounded-2xl border border-border bg-[#FDFDFC] bg-opacity-70 p-3 backdrop-blur-xl backdrop-filter dark:bg-[#121212]">
        <NavigationMenu>
          <Link href="/">
            <span className="sr-only">Project Aqua Logo</span>
            <Icons.logo className="h-8 w-8" />
          </Link>
          <ul className="mx-3 hidden space-x-2 font-medium text-sm md:flex">
            {links.map(({ path, title }) => {
              const isActive =
                path === "/updates"
                  ? pathname.includes("updates")
                  : path === lastPath;

              return (
                <li key={path}>
                  <Link
                    className={cn(
                      "inline-flex h-8 items-center justify-center rounded-md px-3 py-2 font-medium text-secondary-foreground text-sm transition-colors hover:bg-secondary",
                      isActive && "bg-secondary hover:bg-secondary"
                    )}
                    href={path}
                  >
                    {title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </NavigationMenu>
        <button
          className="ml-auto p-2 md:hidden"
          onClick={() => handleToggleMenu()}
          type="button"
        >
          <svg
            fill="none"
            height={13}
            width={18}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 12.195v-2.007h18v2.007H0Zm0-5.017V5.172h18v2.006H0Zm0-5.016V.155h18v2.007H0Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <Link
          className="hidden h-8 items-center justify-center rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 md:inline-flex"
          href="https://project-aqua-admin.vercel.app"
        >
          Sign in
        </Link>
      </nav>

      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed top-0 right-0 bottom-0 left-0 z-10 m-[1px] h-screen bg-background px-2"
          initial={{ opacity: 0 }}
        >
          <div className="relative mt-4 flex justify-between p-3">
            <button onClick={handleToggleMenu} type="button">
              <span className="sr-only">Project Aqua Logo</span>
              <Icons.logo className="h-8 w-8" />
            </button>

            <button
              className="absolute top-2 right-[10px] ml-auto p-2 md:hidden"
              onClick={handleToggleMenu}
              type="button"
            >
              <svg
                className="fill-primary"
                height={24}
                width={24}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
              </svg>
            </button>
          </div>

          <div className="h-full overflow-auto">
            <motion.ul
              animate="show"
              className="mb-8 space-y-8 px-3 pt-8 text-[#707070] text-xl dark:text-[#878787]"
              initial="hidden"
              variants={listVariant}
            >
              {links.map(({ path, title }) => {
                const isActive =
                  path === "/updates"
                    ? pathname.includes("updates")
                    : path === lastPath;

                return (
                  <motion.li key={path} variants={itemVariant}>
                    <Link
                      className={cn(isActive && "text-primary")}
                      href={path}
                      onClick={handleToggleMenu}
                    >
                      {title}
                    </Link>
                  </motion.li>
                );
              })}

              <motion.li variants={itemVariant}>
                <Link href="https://project-aqua-admin.vercel.app">
                  Get started
                </Link>
              </motion.li>

              <motion.li
                className="flex items-center space-x-2"
                variants={itemVariant}
              >
                <Link href="https://github.com/JamesSingleton/project-aqua">
                  Open Source
                </Link>
              </motion.li>

              <motion.li
                className="mt-auto border-t-[1px] pt-8"
                variants={itemVariant}
              >
                <Link
                  className="text-primary text-xl"
                  href="https://project-aqua-admin.vercel.app"
                >
                  Sign in
                </Link>
              </motion.li>
            </motion.ul>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
