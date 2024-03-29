import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { buttonVariants } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@repo/ui/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "View, Search, and Add Swim Meets",
  description:
    "Explore all swim events registered by your team. Stay updated on upcoming competitions, track progress, and manage participation effortlessly.",
};

async function getEvents() {
  return [
    {
      id: 1,
      name: "Casteel & Desert Sunrise",
      date: "August 31, 2023",
      location: "Copper Sky Aquatic Center",
    },
    {
      id: 2,
      name: "Corona Del Sol",
      date: "September 7, 2023",
      location: "McClintock High School",
    },
    {
      id: 3,
      name: "Crosswhite Invite",
      date: "September 9, 2023",
      location: "Kerry Croswhite Aquatic Center",
    },
    {
      id: 4,
      name: "Marcos De Niza & Skyline",
      date: "September 14, 2023",
      location: "Skyline Aquatic Center",
    },
    {
      id: 5,
      name: "Florence & Dobson",
      date: "September 21, 2023",
      location: "Rhodes Jr. High School",
    },
    {
      id: 6,
      name: "Charger Invite",
      date: "October 18, 2023",
      location: "McClintock High School",
    },
    {
      id: 7,
      name: "Desert Sunrise, Morenci, & SanTan Foothill",
      date: "October 19, 2023",
      location: "Copper Sky Aquatic Center",
    },
    {
      id: 8,
      name: "Southern AZ Regional Qualifier Invite",
      date: "October 25, 2023",
      location: "Oro Valley Aquatic Center",
    },
    {
      id: 9,
      name: "Cibola, Desert Sunrise, & Eastmark",
      date: "October 26, 2023",
      location: "Copper Sky Aquatic Center",
    },
  ];
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Events</h1>
        <Input
          className="mt-4 md:mt-0 md:max-w-xs"
          placeholder="Search swim meets..."
          type="search"
        />
        <Link className={buttonVariants()} href="/admin/events/create">
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Event
        </Link>
      </div>
      <>
        {events.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">
                You have no events
              </h3>
              <p className="text-sm text-muted-foreground">
                You can start adding swimmers as soon as you add a team.
              </p>
              <Link
                className={cn(buttonVariants(), "mt-4")}
                href="/admin/events/create"
              >
                Add Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.name}</CardTitle>
                  <CardDescription>
                    {event.date} - {event.location}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link
                    href={`/admin/events/${event.id}`}
                    className={cn(buttonVariants(), "mt-4")}
                  >
                    View Details
                    <span className="sr-only"> for {event.name}</span>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </>
    </>
  );
}
