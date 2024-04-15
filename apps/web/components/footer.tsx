"use client";

import Link from "next/link";
import { GithubStars } from "./github-stars";
import { Icons } from "./icons";

export function Footer() {
  return (
    <footer className="border-t-[1px] border-border px-4 md:px-6 pt-10 md:pt-16 bg-background">
      <div className="container">
        <div className="flex justify-between items-center border-border border-b-[1px] pb-10 md:pb-16 mb-12">
          <Link href="/" className="scale-50 -ml-[52px] md:ml-0 md:scale-100">
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
                  <Link href="/">Features</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/pricing">Pricing</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/story">Story</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/updates">Updates</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/download">Download</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/feature-request">Feature Request</Link>
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
                  <Link href="/support">Support</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/policy">Privacy policy</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/open-startup">Open Startup</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/pitch">Investors</Link>
                </li>
              </ul>
            </div>

            <div>
              <span>Solutions</span>
              <ul>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/coaches">For Coaches</Link>
                </li>
                <li className="transition-colors hover:text-primary text-muted-foreground">
                  <Link href="/clubs">For Clubs</Link>
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
