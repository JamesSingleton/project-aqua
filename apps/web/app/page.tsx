import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Testimonials } from "@/components/testimonials";

export default async function Home() {
  return (
    <div className="flex flex-col min-h-[100vh]">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Icons.logo className="h-8 w-auto" />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Features
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Pricing
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            About
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-6 sm:py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <img
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
                height="550"
                src="/placeholder.svg"
                width="550"
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The Ultimate Tool for Swim Coaches and Meet Managers
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    Project Aqua is the all-in-one solution for managing swim
                    teams, tracking stats, registering for events, and setting
                    up meets.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link className={buttonVariants()} href="#">
                    Get Started
                  </Link>
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href="#"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg px-3 py-1 text-sm bg-secondary-foreground text-secondary">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need to Manage Your Swim Team
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  From team tracking to stat analysis, event registration to
                  meet setup, SwimMaster Pro has you covered.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <img
                alt="Image"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                height="310"
                src="/placeholder.svg"
                width="550"
              />
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Team Tracking</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Keep track of all your swimmers, their stats, and their
                        progress over time.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Stat Analysis</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Analyze individual and team stats to identify strengths
                        and areas for improvement.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Event Registration</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Easily manage event registration for your swimmers and
                        relay teams.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Meet Setup</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Set up meets with ease, including event lineups, heat
                        assignments, and more.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <Testimonials />
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                What our users are saying
              </h2>
              <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Hear from swim coaches and meet managers who love using
                SwimTrack.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center justify-center gap-8 lg:gap-12 [&>img]:mx-auto">
              <div className="flex flex-col items-center space-y-4">
                <img
                  alt="User Testimonial"
                  className="aspect-content rounded-full object-cover object-center"
                  height="100"
                  src="/placeholder.svg"
                  width="100"
                />
                <blockquote className="text-lg font-semibold leading-snug lg:text-xl lg:leading-normal xl:text-2xl">
                  “SwimTrack has revolutionized how we manage our swim team.
                  It's a game changer!“
                </blockquote>
                <div>
                  <div className="font-semibold">Alex Johnson</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Head Coach, Swim Club
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <img
                  alt="User Testimonial"
                  className="aspect-content rounded-full object-cover object-center"
                  height="100"
                  src="/placeholder.svg"
                  width="100"
                />
                <blockquote className="text-lg font-semibold leading-snug lg:text-xl lg:leading-normal xl:text-2xl">
                  “The time tracking feature is a lifesaver. It's so easy to use
                  and incredibly accurate.“
                </blockquote>
                <div>
                  <div className="font-semibold">Sarah Williams</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Assistant Coach, Dolphins Swim Team
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <img
                  alt="User Testimonial"
                  className="aspect-content rounded-full object-cover object-center"
                  height="100"
                  src="/placeholder.svg"
                  width="100"
                />
                <blockquote className="text-lg font-semibold leading-snug lg:text-xl lg:leading-normal xl:text-2xl">
                  “Organizing meets has never been easier. SwimTrack is a
                  must-have for any meet manager.“
                </blockquote>
                <div>
                  <div className="font-semibold">Mark Thompson</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Meet Manager, State Championships
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 SwimMaster Pro. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
