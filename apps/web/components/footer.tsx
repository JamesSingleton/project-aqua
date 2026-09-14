"use client";

import Link from "next/link";
import { GithubStars } from "./github-stars";
import { Icons } from "./icons";

export function Footer() {
  return (
    <footer className="border-t-[1px] border-border px-4 md:px-6 pt-10 md:pt-16 bg-background">
      <div className="container">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
          <Link
            href="/"
            className="scale-50 -ml-[52px] md:ml-0 md:scale-100"
            prefetch={false}
          >
            <Icons.logo className="h-8 w-8" />
            <span className="sr-only">Project Aqua</span>
          </Link>

          <span className="font-normal md:text-2xl text-right">
            Manage your swim team effortlessly.
          </span>
        </div>

        <div className="flex flex-col md:flex-row w-full mb-10 md:mb-20">
          <div className="flex flex-col space-y-8 md:space-y-0 md:flex-row md:w-6/12 justify-between leading-8">
            <div>
              <span className="font-medium">Product</span>
              <ul>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/" prefetch={false}>
                    Features
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/pricing" prefetch={false}>
                    Pricing
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/story" prefetch={false}>
                    Story
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/updates" prefetch={false}>
                    Updates
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/download" prefetch={false}>
                    Download
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/feature-request" prefetch={false}>
                    Feature Request
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <span>Resources</span>
              <ul>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link
                    href="https://github.com/JamesSingleton/project-aqua"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/support" prefetch={false}>
                    Support
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/policy" prefetch={false}>
                    Privacy policy
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/terms" prefetch={false}>
                    Terms and Conditions
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/open-startup" prefetch={false}>
                    Open Startup
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/pitch" prefetch={false}>
                    Investors
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <span>Solutions</span>
              <ul>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/coaches" prefetch={false}>
                    For Coaches
                  </Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/clubs" prefetch={false}>
                    For Clubs
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="md:w-6/12 flex mt-8 md:mt-0 md:justify-end">
            <div className="flex justify-between md:items-end flex-col space-y-14">
              <div className="flex items-center">
                <GithubStars />
                {/* <SocialLinks /> */}
              </div>
              <div className="md:mr-0 mr-auto">{/* <StatusWidget /> */}</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
